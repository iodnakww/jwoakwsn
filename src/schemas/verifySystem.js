const { model, Schema } = require("mongoose");

let verifySchema = new Schema({
    Guild: { type: String, required: true }, 
    Channel: { type: String, required: true }, 
    Role: { type: String, required: true }, 
    LogChannel: { type: String, default: null }, 
    Message: { type: String, required: true }, 
    Verified: { type: Array, default: [] } 
});

module.exports = model("verify", verifySchema);