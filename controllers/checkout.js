const Cart = require('../models/cartSchema');
const Address = require('../models/addressSchema');
const Order = require('../models/orderSchema');
const User = require('../models/userSchema');
const Coupon = require('../models/couponSchema');
const Product = require('../models/productSchema');
const moment = require('moment');
const razorpay = require('razorpay');
const Wallet = require('../models/walletschema');
const Transaction = require('../models/transactionschema');

let instance = new razorpay({
    key_id: "rzp_test_oO3a8uVtaGGjX8",
    key_secret: "761oZRgwI2AxQwnGrp0NBJzt"

})

module.exports = {
    getCheckoutPage: async (req, res) => {
        try {
            const user = req.session.user;
            if (!user) return res.redirect('/login');

            const userId = user._id;
            let cart = await Cart.findOne({ userId }).populate('items.product').lean();
            const addresses = await Address.find({ userId }).lean();
            const defaultAddress = addresses.find(address => address.is_default);

            if (!cart) {
                cart = {
                    items: [],
                    subTotal: 0,
                    shippingCost: 0,
                    total: 0
                };
            } else {
                cart.subTotal = cart.items.reduce((acc, item) => acc + (item.product.price * item.quantity ), 0);
                cart.shippingCost = 10; 
                cart.total = cart.subTotal + cart.shippingCost;
            }

            res.render('user/checkout', { cart, addresses, defaultAddress });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    },

    placeOrder : async (req, res) => {
        try {
            const userData = req.session.user;
            if (!userData) {
                return res.status(401).json({ message: 'User not logged in' });
            }
    
            const userId = userData._id;
            const user = await User.findById(userId).populate('cart.product');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            if (user.cart.length === 0) {
                return res.status(400).json({ message: 'Cart is empty' });
            }
    
            const { paymentMethod, billingAddress } = req.body;
            if (!paymentMethod || !billingAddress) {
                return res.status(400).json({ message: 'Payment method and billing address are required' });
            }
    
            const totalAmount = user.cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
            const items = user.cart.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                total: item.product.price * item.quantity
            }));
    
            const orderDetails = {
                userId: userId,
                items: items,
                totalAmount: totalAmount,
                paymentMethod: paymentMethod,
                billingAddress: billingAddress,
                status: 'Pending',
                createdAt: new Date()
            };
    
            if (paymentMethod === 'Wallet') {
                const wallet = await Wallet.findOne({ userId });
                if (!wallet || wallet.balance < totalAmount) {
                    return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
                }
    
                wallet.balance -= totalAmount;
                const transaction = new Transaction({
                    userId,
                    amount: totalAmount,
                    description: 'Wallet payment for order',
                    type: 'debit',
                    status: 'completed'
                });
    
                await transaction.save();
                wallet.transactions.push(transaction._id);
                await wallet.save();
    
                const order = new Order(orderDetails);
                await order.save();
    
                user.cart = [];
                await user.save();
    
                return res.json({ success: true, message: 'Order placed successfully', orderId: order._id });
            } else if (paymentMethod === 'Razorpay') {
                const order = new Order(orderDetails);
                await order.save();
    
                const options = {
                    amount: totalAmount * 100, 
                    currency: "INR",
                    receipt: String(order._id)
                };
                instance.orders.create(options, function(err, razorpayOrder) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'Razorpay order creation failed', error: err });
                    }
                    res.json({ success: true, orderId: order._id, razorpayOrder });
                });
            } else {
                const order = new Order(orderDetails);
                await order.save();
    
                user.cart = [];
                await user.save();
                res.redirect('/profile');
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },
    
    

    getOrderDetailsPage: async (req, res) => {
        try {
            const user = req.session.user;
            if (!user) return res.redirect('/login');

            const orderId = req.params.id;
            const order = await Order.findById(orderId).populate('items.product').populate('billingAddress').populate('shippingAddress').lean();

            if (!order || order.userId.toString() !== user._id.toString()) return res.status(404).send('Order not found');

            res.render('user/order_details', { order });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    },

    cancelOrder: async (req, res) => {
        try {
            const user = req.session.user;
            if (!user) return res.redirect('/login');

            const orderId = req.params.id;
            const order = await Order.findById(orderId);

            if (!order || order.userId.toString() !== user._id.toString()) return res.status(404).send('Order not found');

            if (order.status === 'Pending') {
                order.status = 'Cancelled';
                await order.save();
                res.redirect(`/order/${orderId}`);
            } else {
                res.status(400).send('Order cannot be cancelled at this stage');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    },

 returnOrder : async (req, res) => {
        try {
            const user = req.session.user;
            if (!user) return res.redirect('/login')
    
            const orderId = req.params.id;
            const order = await Order.findById(orderId);
            if (!order || order.userId.toString() !== user._id.toString()) {
                return res.status(404).send('Order not found');
            }
         
            if (order.status === 'Delivered') {
                const currentDate = new Date();
                if (!order.deliveredAt) {
                    return res.status(400).send('Order delivery date is missing');
                }
                const returnDeadline = new Date(order.deliveredAt);
                returnDeadline.setDate(returnDeadline.getDate() + 7); // 7 days return window
    
                if (currentDate > returnDeadline) {
                    return res.status(400).send('Return period has expired');
                }
                res.render('user/profile/return_order', { order });
                // Update order status to 'Returned'
                order.status = 'Returned';
                await order.save();
     
                res.redirect('/profile');
            } else {
                res.status(400).send('Order cannot be returned at this stage');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    },
    
  
    

    getCartCheckoutPage: async (req, res) => {
        try {
            const user = req.session.user;
            if (!user) return res.redirect('/login');

            const userId = user._id;
            const cart = await Cart.findOne({ userId }).populate('items.product').lean();
            const addresses = await Address.find({ userId }).lean();
            const defaultAddress = addresses.find(address => address.is_default);

            res.render('user/cart_checkout', { cart, addresses, defaultAddress });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    },

    getInvoice: async (req, res) => {
        try {
            const user = req.session.user;
            if (!user) return res.redirect('/login');

            const orderId = req.params.id;
            const order = await Order.findById(orderId).populate('items.product').populate('billingAddress').populate('shippingAddress').lean();

            if (!order || order.userId.toString() !== user._id.toString()) return res.status(404).send('Order not found');

            res.render('user/invoice', { order });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    },

    setDefaultAddress: async (req, res) => {
        try {
            const user = req.session.user;
            if (!user) return res.redirect('/login');

            const addressId = req.params.id;
            const userId = user._id;

            await Address.updateMany({ userId }, { $set: { is_default: false } });
            await Address.findByIdAndUpdate(addressId, { $set: { is_default: true } });

            res.redirect('/profile');
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    },

    generateOrderRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            const options = {
                amount: total * 100,
                currency: "INR",
                receipt: String(orderId)
            };
            instance.orders.create(options, function(err, order) {
                if (err) {
                    console.log("failed");
                    console.log(err);
                    reject(err);
                } else {
                    console.log("Order Generated RazorPAY: " + JSON.stringify(order));
                    resolve(order);
                }
            });
        });
    },

    
 loadUserCoupons : async (req, res) => {
    try {
        const userData = req.session.user;
        if (!userData) {
            console.log('User not logged in');
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }
        const userId = userData._id;

        const coupons = await Coupon.find({ status: true, usedBy: { $ne: userId } }).lean(); // Fetch only active coupons not used by this user

        const couponData = coupons.map(coupon => ({
            ...coupon,
            expiryDate: moment(coupon.expiryDate).format('MMMM D, YYYY'),
            createdDate: moment(coupon.createdDate).format('MMMM D, YYYY')
        }));

        res.json({ success: true, coupons: couponData }); 
    } catch (error) {
        console.error('Error loading coupons:', error);
        res.status(500).json({ success: false, message: 'Failed to load coupons' });
    }
},

applyCoupon: async (req, res) => {
    try {
        const userData = req.session.user;
        if (!userData) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }
        const userId = userData._id;
        const { couponId } = req.body;

        const user = await User.findById(userId).populate('cart.product').lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const coupon = await Coupon.findById(couponId);
        if (!coupon || !coupon.status) {
            return res.status(404).json({ success: false, message: 'Invalid or expired coupon' });
        }

        const today = moment();
        if (moment(coupon.expiryDate).isBefore(today)) {
            return res.status(400).json({ success: false, message: 'Coupon expired' });
        }

        let subTotal = 0;
        user.cart.forEach(item => {
            subTotal += item.product.price * item.quantity;
        });

        const discountAmount = (subTotal * coupon.discount) / 100;
        const grandTotal = subTotal - discountAmount + 1; 

        if (grandTotal < 5000) {
            return res.status(400).json({ success: false, message: 'Grand total must be at least 5000 to apply this coupon' });
        }

        if (subTotal < coupon.maxPrice) {
            return res.status(400).json({ success: false, message: `Subtotal must be at least ${coupon.maxPrice} to apply this coupon` });
        }

        // Store discount details in session
        req.session.coupon = {
            code: coupon.code,
            discountAmount,
            grandTotal
        };

        // Mark the coupon as used by the user
        await Coupon.updateOne({ _id: coupon._id }, { $addToSet: { usedBy: userId } });

        // Respond with updated cart details
        res.json({
            success: true,
            message: 'Coupon applied successfully',
            discountAmount,
            updatedCart: {
                cart: user.cart,
                subTotal,
                grandTotal
            }
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
},

};



