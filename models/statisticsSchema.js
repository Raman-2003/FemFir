const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const statisticsSchema = new Schema({
    overallOrderAmount: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Statistics', statisticsSchema);
