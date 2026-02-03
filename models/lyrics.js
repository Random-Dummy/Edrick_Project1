const mongoose = require("mongoose");

const lyricsSchema = new mongoose.Schema({
    spotifyTrackId: { type: String, required: true, unique: true },
    songName: { type: String, required: true },
    artist: String,
    lyrics: String,
}, { timestamps: true });

module.exports = mongoose.model("Lyrics", lyricsSchema);