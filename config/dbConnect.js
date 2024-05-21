const mongoose = require('mongoose');
require('dotenv').config(); 
    try {
        const url = process.env.MONGODB_URL;      
        var connection = mongoose.connect(url);
        console.log("Your DB is connected Successfully..!");
        
    } catch (error) {
        console.log("Something Wrong"+error)
    }

module.exports = connection;