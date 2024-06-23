// models/Sale.js

const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
    productName: String,
    quantity: Number,
    price: Number,
    totalPrice: Number,
    saleDate: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['Pending', 'Processed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Request Processed'],
        default: 'Delivered'
    }
});

module.exports = mongoose.model('Sale', SaleSchema);
