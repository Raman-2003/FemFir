const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Ledger = require('../models/ledgerSchema');

const orderSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
            total: { type: Number, required: true }
        }
    ],
    totalAmount: { 
        type: Number,   
        required: true
    }, 
    
    billingAddress: {
        type: Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    }, 
    shippingAddress: {
        type: Schema.Types.ObjectId,
        ref: 'Address'
    },
    paymentMethod: {
        type: String,
        enum: ['Paypal', 'Payoneer', 'Check Payment', 'Direct Bank Transfer', 'Razorpay', 'Wallet', 'Cash on Delivery'],
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Processed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Request Processed'],
        default: 'Pending'
    },
    returnStatus: {
        type: String,
        enum: ['Not Requested', 'Requested', 'Approved', 'Rejected', 'Canceled'],
        default: 'Not Requested'
    },
    returnReason: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

orderSchema.post('save', async function(doc, next) {
    try {
        await Ledger.create({
            entryType: 'Order',
            entryId: doc._id,
            userId: doc.userId,
            amount: doc.totalAmount,
            description: `Order placed`,
            transactionType: 'debit',
            status: 'completed'
        });
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Order', orderSchema);
