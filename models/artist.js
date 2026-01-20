const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    spotifyArtistId: { type: String, required: true, unique: true },
    geniusArtistId: { type: String, unique: true },
    pfp: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Artists', artistSchema);