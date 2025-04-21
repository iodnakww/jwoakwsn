const mongoose = require('mongoose');

const paymentSetupSchema = new mongoose.Schema({
    GuildID: String,
    ChannelID: String,
    Title: String,
    Description: String,
    Payments: [
        {
            Method: String,
            Emoji: String,
            Number: String,
            QR: String // optional: base64 atau link
        }
    ],
});

module.exports = mongoose.model("PaymentSetup", paymentSetupSchema);
