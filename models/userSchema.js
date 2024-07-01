const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const cartItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    total: { type: Number, required: true }
});


const userSchema =new mongoose.Schema({

    firstname:{
         type: String,
         required:true,
    },
    lastname:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:false, 
        unique:true
    },
    email:{ 
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:false
    },
    googleId: {
        type:String,
        required:false
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    is_blocked:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
   
    hintname:{
        type:String,
        required:false 
    },
    gender:{
        type:String,
        required:false
    },
    
    cart: [cartItemSchema] ,

    wishlist:[
        { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
    ],
    totalDiscount: { type: Number, default: 0 },
    referralCode: { type: String, unique: true }, 
    hasUsedReferral: { type: Boolean, default: false }
 
},{
    timestamps:true
}) 


module.exports = mongoose.model('User', userSchema);
 