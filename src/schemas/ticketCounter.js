const { Schema, model } = require('mongoose');

const TicketCounterSchema = new Schema({
    GuildID: { type: String, required: true },
    LastTicketID: { type: Number, default: 0 },
});

module.exports = model('TicketCounter', TicketCounterSchema);