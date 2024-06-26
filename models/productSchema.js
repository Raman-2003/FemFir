const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: { 
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    mrp: {  // Add MRP field
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', 
        required: true
    },
    mainImage: {
        type: String,
        required: true
    },
    subImages: {
        type: [String]
    },
    status: {
        type: String,
        enum: ['listed', 'unlisted'],
        default: 'listed'
    },
    isWishlisted: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
