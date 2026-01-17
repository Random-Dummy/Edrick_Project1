const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, required: true, unique: true },
    password: String,
    pfp: String,
}, { timestamps: true });

module.exports = mongoose.model('Users', userSchema);

    // spotify: {
    //     spotifyUserId: String,
    //     accessToken: String,
    //     refreshToken: String
    // },