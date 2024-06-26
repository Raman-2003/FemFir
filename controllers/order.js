// controllers/order.js
const User = require("../models/userSchema");
const Product = require("../models/productSchema");
const Address = require("../models/addressSchema");
const Order = require("../models/orderSchema");
const Sale = require("../models/saleSchema");


const getOrderListPageAdmin = async (req, res) => {
    try {
        const PAGE_SIZE = 10; // Number of orders per page
        const currentPage = parseInt(req.query.page) || 1;
        const skip = (currentPage - 1) * PAGE_SIZE;
 
        const orders = await Order.find({})
            .populate('userId')
            .populate('items.product')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(PAGE_SIZE)
            .lean();

        const totalOrders = await Order.countDocuments({});
        const totalPages = Math.ceil(totalOrders / PAGE_SIZE);

        res.render("admin/orders-list", {
            orders,
            totalPages,
            currentPage,
            layout: 'adminlayout'
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};


const changeOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;

        // Find the order and populate necessary details
        const order = await Order.findById(orderId)
            .populate('items.product')
            .populate('userId') // Populate user details
            .populate('shippingAddress'); // Populate shipping address details

        // Log the order to debug
        console.log('Order:', order);

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

        // Update the order status
        await Order.updateOne({ _id: orderId }, { status });

        // If the status is 'Delivered', add to the sales collection
        if (status === 'Delivered') {
            const sales = order.items.map(item => ({
                productName: item.product.name,
                product: item.product._id, // Include the product reference
                quantity: item.quantity,
                price: item.product.price,
                totalPrice: item.total,
                saleDate: new Date(),
                user: order.userId._id, // Add the user reference
                address: order.billingAddress._id // Add the address reference
            }));

            // Insert sales records with user and address references
            await Sale.insertMany(sales);
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

        res.render("admin/order-details-admin", {
            order,
            layout: 'adminlayout'
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = {
    getOrderListPageAdmin,
    changeOrderStatus,
    getOrderDetailsPageAdmin,
};
