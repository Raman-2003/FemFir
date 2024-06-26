const mongoose = require('mongoose'); 

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

module.exports = mongoose.model('Sale', SaleSchema);
