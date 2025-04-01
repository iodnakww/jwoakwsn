const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
    {
        Guild: { 
            type: String, 
            required: true, 
            unique: true 
        },
        Channel: {
            type: String, 
            required: true,
        },
        VouchNo: {
            type: Number, 
            default: 0, // Menyimpan jumlah Vouch yang telah digunakan
        }
    },
    {
        timestamps: true // Menyimpan waktu pembuatan dan update
    }
);

module.exports = mongoose.model("Rating", ratingSchema);