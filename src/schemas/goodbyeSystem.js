const mongoose = require("mongoose");

const goodbyeMessageSchema = new mongoose.Schema({
    guildId: String,
    channelId: String,
    message: String,
});

module.exports = mongoose.model("GoodbyeMessage", goodbyeMessageSchema);