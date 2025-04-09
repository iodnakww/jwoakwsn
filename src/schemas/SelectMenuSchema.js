const mongoose = require('mongoose');

const selectMenuSchema = new mongoose.Schema({
    GuildID: { type: String, required: true },
    channels: [
        {
            channelID: { type: String, required: true },
            options: [
                {
                    label: { type: String, required: true },
                    description: { type: String, required: true },
                    emoji: { type: String, default: null },
                    response: { type: String, required: true },
                    imageResponse: { type: String, default: null },  // Image URL for response
                }
            ],
        }
    ],
});

module.exports = mongoose.model("SelectMenu", selectMenuSchema);
