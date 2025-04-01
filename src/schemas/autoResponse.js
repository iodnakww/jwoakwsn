const mongoose = require('mongoose');

const autoResponseSchema = new mongoose.Schema({
    GuildID: String, // ID server
    Keyword: String,  // Kata kunci pencocokan pesan
    Response: String, // Pesan balasan
    Timestamp: { type: Date, default: Date.now }, // Waktu pembuatan auto-response
});

module.exports = mongoose.model('AutoResponse', autoResponseSchema);