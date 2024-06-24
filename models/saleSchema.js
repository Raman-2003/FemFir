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
    },
    user: { // Reference to the User schema
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // Assuming a sale must have a user
    },
    address: { // Reference to the Address schema
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: false // Address is optional, based on your requirements
    }
});

module.exports = mongoose.model('Sale', SaleSchema);
