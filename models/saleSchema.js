const mongoose = require('mongoose'); 
const Ledger = require('../models/ledgerSchema');

const SaleSchema = new mongoose.Schema({
    productName: String,
    product: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true 
    },
    quantity: Number,
    price: Number,
    totalPrice: Number,
    saleDate: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['Pending', 'Processed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Request Processed'],
        default: 'Delivered'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    address: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Address',
        required: false 
    }
});

SaleSchema.post('save', async function(doc, next) {
    try {
        await Ledger.create({
            entryType: 'Sale',
            entryId: doc._id,
            userId: doc.user,
            amount: doc.totalPrice,
            description: `Sale of ${doc.productName}`,
            transactionType: 'credit',
            status: 'completed'
        });
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Sale', SaleSchema);
