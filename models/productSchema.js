const mongoose = require('mongoose');

const Schema = mongoose.Schema

const productSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required: true
    },
    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Category',
        required: true
    },
    image:{
        type: Array,
        required: true
    },
    is_blocked: {
        type: Boolean,
        default: false,
    },
    isWishlisted: {
        type: Boolean,
        dafault: false
    },
    isOnCart: {
        type: Boolean,
        default: false,
    }
})

const Product = mongoose.model('Product',productSchema);
module.exports = {
    Product
}