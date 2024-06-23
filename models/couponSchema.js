const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  maxPrice: {
    type: Number,
    required: true
  },
  status: {
    type: Boolean,
    default: true
  },
  description: {
    type: String, 
    required: true, 
    trim: true
  },
  usedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

module.exports = mongoose.model('Coupon', couponSchema);
