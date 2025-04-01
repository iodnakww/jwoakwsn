const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    roleId: { type: String, required: true },
    expiresAt: { type: Date, default: null } // Null berarti blacklist permanen
});

module.exports = mongoose.model('Blacklist', blacklistSchema);