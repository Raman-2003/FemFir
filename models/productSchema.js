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
    mrp: {  
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
    offer: {
        discountPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        expiryDate: {
            type: Date
        }
    }    
}, {
    timestamps: true
});


// Static method to calculate discounted price
productSchema.statics.getDiscountedPrice = function(price, discountPercentage, expiryDate) {
    const now = new Date();
    if (discountPercentage > 0 && expiryDate > now) {
        return price - (price * (discountPercentage / 100));
    }
    return price;
};

module.exports = mongoose.model('Product', productSchema);
