const { model, Schema } = require('mongoose');

let TicketSetup = new Schema({
    GuildID: String,
    Channel: String,
    Category: String,
    Transcripts: String,
    Logschannel: String,
    Handlers: String,
    Description: String,
    Button: String,
    Emoji: String,
    Button2: String,
    Emoji2: String,
    Button3: String,
    Emoji3: String,
    Title: String,
    Color: String
});

module.exports = model('TicketSetup', TicketSetup);