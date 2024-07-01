const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URL = process.env.MONGODB_URL;

mongoose.connect(MONGO_URL, {
         }).then(() => {
             console.log('Connected to MongoDB');
         }).catch((error) => {
             console.error('Error connecting to MongoDB:', error.message);
         });

  