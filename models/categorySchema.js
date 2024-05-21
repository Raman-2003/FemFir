const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CategorySchema = new Schema({
    category:{
        type:String,
        required:true
    },
    image:{
        type:Array,
        required:true
    },
    is_unListed: {
        type:Boolean,
        default:false
    },
}, {collection: 'category'})

const Category = mongoose.model('category',CategorySchema);

module.exports = {Category};
