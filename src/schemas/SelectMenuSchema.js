const mongoose = require("mongoose");

const selectMenuSchema = new mongoose.Schema({
    GuildID: { type: String, required: true },
    options: [
        {
            label: { type: String, required: true },
            description: { type: String },
            emoji: { type: String },
            response: { type: String, required: true },
        }
    ],
});

module.exports = mongoose.model("SelectMenuSchema", selectMenuSchema);