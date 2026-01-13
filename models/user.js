const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, required: true, unique: true },
    password: String,
    createdAt: { type: Date, default: Date.now },
    profilepic: String,
})
module.exports = mongoose.model('Users', userSchema);