const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Ledger = require('../models/ledgerSchema');

const TransactionSchema = new Schema({
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
        type: String,
        default: true
    },
    type: {
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

TransactionSchema.post('save', async function(doc, next) {
    try {
        await Ledger.create({
            entryType: 'Transaction',
            entryId: doc._id,
            userId: doc.userId,
            amount: doc.amount,
            description: doc.description,
            transactionType: doc.type,
            status: doc.status
        });
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Transaction', TransactionSchema);