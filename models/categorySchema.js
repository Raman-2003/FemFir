const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    status: {
        type: String, 
        enum: ['listed', 'unlisted'],
        default: 'unlisted'
    },
    nameLower: { 
        type: String,
        required: true,
        unique: true 
    },
    offer:{
        discountPercentage: {
            type:Number,
            min:0,
            max:100,
            default:0
        },
        expiryDate:{
            type:Date
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
 