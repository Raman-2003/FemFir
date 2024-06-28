const Razorpay = require('razorpay');
const crypto = require('crypto');
const Wallet = require('../models/walletschema');
const Transaction = require('../models/transactionschema');
const Order = require('../models/orderSchema');
const Product = require('../models/productSchema');

const razorpayInstance = new Razorpay({
    key_id: "rzp_test_oO3a8uVtaGGjX8",
    key_secret: "761oZRgwI2AxQwnGrp0NBJzt"
});

const getWallet = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const userId = req.session.user._id;

        const { startDate, endDate, minAmount, maxAmount, type, sort } = req.query;

        const wallet = await Wallet.findOne({ userId });

        let query = { userId };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) query.amount.$gte = parseFloat(minAmount);
            if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
        }

        if (type) {
            query.type = type;
        }

        let sortOrder = {};
        switch (sort) {
            case 'maxAmount':
                sortOrder.amount = -1; 
                break;
            case 'minAmount':
                sortOrder.amount = 1; 
                break;
            case 'oldDate':
                sortOrder.createdAt = 1; 
                break;
            case 'newDate':
                sortOrder.createdAt = -1; 
                break;
            default:
                sortOrder.createdAt = -1; 
        }

        const transactions = await Transaction.find(query).sort(sortOrder);

        res.render('user/wallet', {
            title: "Wallet",
            wallet: wallet || { balance: 0 },
            transactions
        });
    } catch (error) {
        console.error('Error fetching wallet data:', error);
        res.status(500).send('Server error');
    }
};

// Render the add money form
const addMoneyForm = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        res.render('user/addmoney', { title: "Add Money" });
    } catch (error) {
        console.error('Error rendering add money form:', error);
        res.status(500).redirect('/login');
    }
};

// Initiate a Razorpay payment order
const initiatePayment = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const { amount, note } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const options = {
            amount: amount * 100,
            currency: 'INR',
            receipt: `receipt_${new Date().getTime()}`,
            notes: {
                description: note || 'Adding money to wallet'
            }
        };

        const order = await razorpayInstance.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error('Error initiating payment:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Verify the Razorpay payment and update the wallet
const verifyPayment = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount, note } = req.body;

        const generated_signature = crypto.createHmac('sha256', razorpayInstance.key_secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            try {
                const userId = req.session.user._id;
                let wallet = await Wallet.findOne({ userId });
                if (!wallet) {
                    wallet = new Wallet({ userId, balance: 0, transactions: [] });
                }

                wallet.balance += amount / 100;
                const transaction = new Transaction({
                    userId,
                    amount: amount / 100,
                    description: note || 'Added to wallet',
                    type: 'credit',
                    status: 'completed'
                });

                await transaction.save();
                wallet.transactions.push(transaction._id);
                await wallet.save();

                res.json({ success: true, message: 'Payment verified and wallet updated' });
            } catch (error) {
                console.error('Error updating wallet:', error);
                res.status(500).json({ success: false, message: 'Server error' });
            }
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getWallet,
    addMoneyForm,
    initiatePayment,
    verifyPayment,
};
