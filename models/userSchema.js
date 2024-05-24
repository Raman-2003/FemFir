const mongoose = require('mongoose');

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
    }
},{
    timestamps:true
})

module.exports = mongoose.model('User',userSchema);

