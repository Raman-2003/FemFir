const Address = require('../models/addressSchema');
const User = require('../models/userSchema');
const Order = require('../models/orderSchema'); 
const bcrypt = require('bcrypt');
const ReturnOrder = require('../models/returnOrdersSchema'); 
const Transaction = require('../models/transactionschema')
const Wallet = require('../models/walletschema')

module.exports = {

    loadProfile: async (req, res) => {
        try {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/login');
            }
    
            const id = user._id;
            const userData = await User.findById(id).lean();
            const userAddress = await Address.find({ userId: id }).lean();
    
            // Pagination settings
            const perPage = 5;
            const page = parseInt(req.query.page) || 1;
    
            const userOrders = await Order.find({ userId: id })
                .populate({
                    path: 'items.product',
                    select: 'name mainImage'
                })
                .populate('billingAddress')
                .populate('shippingAddress')
                .sort({ createdAt: -1 })
                .skip((perPage * page) - perPage)
                .limit(perPage)
                .lean();
    
            const totalOrders = await Order.countDocuments({ userId: id });
    
            if (!userData) {
                return res.redirect('/login');
            }
    
            userData.gender = userData.gender || 'Male';
            userData.hintname = userData.hintname || '';
    
            res.render('user/profile/profiles', {
                userData,
                userAddress,
                userOrders,
                current: page,
                pages: Math.ceil(totalOrders / perPage)
            });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    },
    

 // Edit user details
editDetails: (req, res) => {
        try {
            const userData = req.session.user;
            res.render('user/profile/edit_profile', { userData });
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
 },

    // Update edited user details
    updateDetails: async (req, res) => {
        try {
            const id = req.params.id;

            const updatedUser = await User.findByIdAndUpdate(id, {
                $set: {
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    mobile: req.body.mobile,
                    email: req.body.email,
                    hintname: req.body.hintname,
                    gender: req.body.gender
                }
            }, { new: true });

            if (!updatedUser) {
                return res.status(404).send('User not found');
            }

            req.session.user = updatedUser;

            res.redirect('/profile');
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
    },

     // Get manage address page
     manageAddress: async (req, res) => {
        try {
            const userData = req.session.user;
            const id = userData._id;

            const userAddress = await Address.find({ userId: id }).lean();
            res.render('user/manage_address', { userAddress, userData });
        } catch (error) {
            console.log(error);
        }
    },

    // Add new address
    addNewAddress: (req, res) => {
        try {
            res.render('user/profile/addnewAddress');
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
    },

    addNewAddressPost: async (req, res) => {
        try {
            const userData = req.session.user;
            const id = userData._id;

            const address = new Address({
                userId: id,
                name: req.body.name,
                mobile: req.body.mobile,
                addressLine1: req.body.address,
                locality: req.body.locality,
                city: req.body.city,
                state: req.body.state,
                pin: req.body.pincode,
                is_default: req.body.default ? true : false,
                addressType: req.body.addressType
            });

            await address.save();

            res.redirect('/profile');
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
    },

    editAddress: async (req, res) => {
        try {
            const id = req.params.id;
            const address = await Address.findById(id).lean();
            res.render('user/profile/editAddress', { address });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    },

    editAddressPost: async (req, res) => {
        try {
            const id = req.params.id;
            await Address.findByIdAndUpdate(id, {
                $set: {
                    name: req.body.name,
                    mobile: req.body.mobile,
                    addressLine1: req.body.address1,
                    addressLine2: req.body.address2,
                    city: req.body.city,
                    state: req.body.state,
                    pin: req.body.pin,
                    is_default: req.body.default ? true : false
                }
            }, { new: true });
            res.redirect('/profile#address-tab');
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Delete address
    deleteAddress: async (req, res) => {
        try {
            const id = req.params.id;

            await Address.findByIdAndDelete(id);
            res.redirect('/profile#address-tab');
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    },

// Cancel order
cancelOrder: async (req, res) => {
    try {
        const orderId = req.params.id;

        // Find the order and populate the product details
        const order = await Order.findById(orderId).populate('items.product');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Allow cancellation for 'Pending', 'Processed', and 'Shipped' statuses
        if (['Pending', 'Processed', 'Shipped'].includes(order.status)) {
            // Update order status to 'Cancelled'
            order.status = 'Cancelled';
            await order.save();

            // Handle refund based on payment method
            if (['Wallet', 'Razorpay'].includes(order.paymentMethod)) {
                const userId = order.userId;
                let wallet = await Wallet.findOne({ userId });

                if (!wallet) {
                    wallet = new Wallet({ userId, balance: 0, transactions: [] });
                }

                const productNames = order.items.map(item => item.product.name).join(', ');
                const description = `Refund for cancelled order: ${productNames}`;

                // Credit the order amount back to the wallet
                wallet.balance += order.totalAmount;

                const transaction = new Transaction({
                    userId,
                    amount: order.totalAmount,
                    description: description,
                    type: 'credit',
                    status: 'completed'
                });

                await transaction.save();
                wallet.transactions.push(transaction._id);
                await wallet.save();
            }

            res.redirect('/profile#orders-tab');
        } else {
            return res.status(400).send('Order cannot be cancelled at this stage');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
},


    viewOrder : async (req, res) => {
        try {
            const orderId = req.params.id;
            const order = await Order.findById(orderId)
                .populate({
                    path: 'items.product',
                    select: 'name mainImage'
                })
                .populate({
                    path: 'billingAddress',
                    populate: { path: 'userId', select: 'name' }
                })
                .populate({
                    path: 'shippingAddress',
                    populate: { path: 'userId', select: 'name' }
                })
                .lean();
    
            if (!order) {
                return res.status(404).send('Order not found');
            }
    
            res.render('user/profile/view_order', { order });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    },

    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;
            const userId = req.session.user._id;

            if (newPassword !== confirmPassword) {
                return res.status(400).send('New password and confirm password do not match');
            }

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).send('User not found');
            }

            const isMatch = bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).send('Current password is incorrect');
            }

            // Hash the new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update the user's password
            user.password = hashedPassword;
            await user.save();

            req.session.user = user;

            // Redirect to the profile page
            res.redirect('/profile');
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    },

    returnOrderForm: async (req, res) => {
        try {
            const orderId = req.params.id;
            const order = await Order.findById(orderId).populate('items.product');
 
            if (!order || order.status !== 'Delivered') {
                return res.status(404).send('Order not found or not eligible for return');
            }

            res.render('user/profile/return_order', { order });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Process return order
processReturnOrder: async (req, res) => {
    try {
        const orderId = req.params.id;
        const { returnReason } = req.body;

        // Find the order and check if it can be returned
        const order = await Order.findById(orderId).populate('items.product');

        if (!order || order.status !== 'Delivered') {
            return res.status(404).send('Order not found or not eligible for return');
        }

        // Create a new ReturnOrder entry
        const returnOrder = new ReturnOrder({
            orderId,
            userId: req.session.user._id, 
            returnReason,
            status: 'Requested'
        });
        await returnOrder.save();

        // Update the order's status to 'Request Processed'
        order.status = 'Request Processed';
        await order.save();

        res.redirect('/profile#orders-tab');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
},

    // Cancel the return request
    cancelReturnOrder: async (req, res) => {
        try {
            const orderId = req.params.id;

            await Order.findByIdAndUpdate(orderId, {
                status: 'Delivered',
                returnStatus: 'Canceled'
            });

            await ReturnOrder.findOneAndUpdate({ orderId }, {
                status: 'Canceled'
            });

            res.redirect('/profile#orders-tab');
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    }
    
};
