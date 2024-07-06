const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Ledger = require('../models/ledgerSchema'); 
const Transaction = require('../models/transactionschema')

const WalletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true 
    },
    balance: {
        type: Number,
        default: 0, 
        required: true
    },
    transactions: [{
        type: Schema.Types.ObjectId,
        ref: 'Transaction'
    }]
}, {
    timestamps: true
});

WalletSchema.post('save', async function(doc, next) {
    try {
        const transactions = doc.transactions;
        for (let transaction of transactions) {
            const txn = await Transaction.findById(transaction);
            await Ledger.create({
                entryType: 'Wallet',
                entryId: doc._id,
                userId: doc.userId,
                amount: txn.amount,
                description: `Wallet transaction`,
                transactionType: txn.type,
                status: txn.status
            });
        }
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Wallet', WalletSchema);