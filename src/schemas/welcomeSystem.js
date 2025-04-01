const mongoose = require("mongoose");

const welcomeMessageSchema = new mongoose.Schema({
    guildId: String,
    channelId: String,
    message: String,
});

module.exports = mongoose.model("WelcomeMessage", welcomeMessageSchema);