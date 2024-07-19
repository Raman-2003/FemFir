const mongoose = require('mongoose');
const User = require("../models/userSchema");
const Product = require("../models/productSchema");
const Address = require("../models/addressSchema");
const Order = require("../models/orderSchema");
const Sale = require("../models/saleSchema");
const Statistics = require('../models/statisticsSchema');

// Function to update the overall order amount
async function updateOverallOrderAmount(changeAmount) {
    const stats = await Statistics.findOneAndUpdate(
        {},
        { $inc: { overallOrderAmount: changeAmount } },
        { new: true, upsert: true } 
    );
    return stats.overallOrderAmount;
}

const getOrderListPageAdmin = async (req, res) => {
    try {
        const PAGE_SIZE = 12; 
        const currentPage = parseInt(req.query.page) || 1;
        const skip = (currentPage - 1) * PAGE_SIZE;
 
        const orders = await Order.find({})
            .populate('userId')
            .populate('items.product')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(PAGE_SIZE)
            .lean();

        // Calculate the discounted price for each item
        orders.forEach(order => {
            order.items.forEach(item => {
                item.product.discountedPrice = Product.getDiscountedPrice(item.product.price, item.product.offer.discountPercentage, item.product.offer.expiryDate);
            });
        });

        const totalOrders = await Order.countDocuments({});
        const totalPages = Math.ceil(totalOrders / PAGE_SIZE);

        const pagination = Array.from({ length: totalPages }, (_, i) => i + 1);

        res.render("admin/orders-list", {
            orders,
            totalPages,
            currentPage,
            pagination,
            layout: 'adminLayout'
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};

const changeOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;

        const order = await Order.findById(orderId)
            .populate('items.product')
            .populate('userId')
            .populate('billingAddress'); 

        if (!order) {
            console.error(`Order with ID ${orderId} not found`); 
            return res.status(404).send("Order not found");
        }

        if (!order.userId) {
            console.error(`User not found for order ID ${orderId}`);
            return res.status(400).send("User not found for this order");
        }

        if (!order.billingAddress) {
            console.error(`Shipping address not found for order ID ${orderId}`);
            return res.status(400).send("Shipping address not found for this order");
        }

        const previousStatus = order.status;

        // Update the order status
        await Order.updateOne({ _id: orderId }, { status });

        // If the status is 'Delivered', add to the sales collection
        if (status === 'Delivered' && previousStatus !== 'Delivered') {
            const sales = order.items.map(item => ({
                productName: item.product.name,
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price,
                totalPrice: item.total,
                saleDate: new Date(),
                user: order.userId._id,
                address: order.billingAddress._id
            }));

            await Sale.insertMany(sales);

            const overallOrderAmount = await updateOverallOrderAmount(order.totalAmount);
            console.log(`Overall Order Amount Updated: ${overallOrderAmount}`);
        }

        res.redirect('/admin/orders?page=' + req.query.page);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};

const getOrderDetailsPageAdmin = async (req, res) => {
    try {
        const orderId = req.query.id;

        const order = await Order.findById(orderId)
            .populate('userId')
            .populate('items.product')
            .populate('billingAddress')
            .populate('shippingAddress')
            .lean();

        // Calculate the discounted price for each item
        order.items.forEach(item => {
            item.product.discountedPrice = Product.getDiscountedPrice(item.product.price, item.product.offer.discountPercentage, item.product.offer.expiryDate);
        });

        res.render("admin/order-details-admin", {
            order,
            layout: 'adminLayout'
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};

// Function to handle return approval
const approveReturn = async (req, res) => {
    try {
        const { orderId, itemId } = req.body;

        const order = await Order.findById(orderId)
            .populate('items.product')
            .populate('userId')
            .populate('billingAddress');

        if (!order) {
            return res.status(404).send("Order not found");
        }

        const item = order.items.id(itemId);
        if (!item) {
            return res.status(404).send("Item not found in order");
        }

        if (order.returnStatus === 'Approved') {
            return res.status(400).send("Return already approved for this item");
        }

        item.returnStatus = 'Approved';
        await order.save();

        const overallOrderAmount = await updateOverallOrderAmount(-item.total);
        console.log(`Overall Order Amount Updated: ${overallOrderAmount}`);

        res.redirect('/admin/orders?page=' + req.query.page);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = {
    getOrderListPageAdmin,
    changeOrderStatus,
    getOrderDetailsPageAdmin,
    approveReturn
};
