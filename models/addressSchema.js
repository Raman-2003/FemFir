const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    addressLine1: { type: String, required: true },
    locality: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pin: { type: String, required: true },
    is_default: { type: Boolean, default: false },
    addressType: { type: String, required: true }
});

module.exports = mongoose.model('Address', addressSchema);
 