const { Schema, model } = require('mongoose');

const testimoniSchema = new Schema({
    Guild: { type: String, required: true },
    Channel: { type: String, default: null },
    SellerRole: { type: String, default: null },
    Buyer: { type: String, required: false },
    Transactions: { type: Number, default: 0 },
});

module.exports = model('Testimoni', testimoniSchema);