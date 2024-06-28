// models/CheckoutSchema.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CheckoutSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cartItems: [
        {
            productId: {
                type: Schema.Types.ObjectId, 
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
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
        enum: ['Paypal', 'Payoneer', 'Check Payment', 'Direct Bank Transfer', 'Cash on Delivery'],
        required: true
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Processed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'], 
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Checkout', CheckoutSchema);
