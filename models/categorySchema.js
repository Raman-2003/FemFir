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
        unique: true // Ensure uniqueness on the normalized name
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
