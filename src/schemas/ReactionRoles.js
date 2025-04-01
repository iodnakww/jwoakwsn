const { model, Schema } = require("mongoose");

let reactionRoles = new Schema({
    GuildID: String,
    roles: Array,
    title: String,
    description: String,
    footer_text: String,
    footer_icon: String,
    image: String,
    color: String,
});

module.exports = model("ReactionRoles", reactionRoles);