const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LedgerSchema = new Schema({
    entryType: {
        type: String,
        enum: ['Sale', 'Order', 'Transaction', 'Wallet'],
        required: true
    },
    entryId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'entryType'
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    transactionType: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Ledger', LedgerSchema);
