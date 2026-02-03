const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    pfp: String,
    token: String
}, { timestamps: true });

module.exports = mongoose.model("Users", userSchema);