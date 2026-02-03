const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    songs: [{
        spotifyTrackId: { type: String, required: true },
        name: { type: String, required: true },
        artist: { type: String, required: true },
        album: String,
        durationMs: Number,
        albumImage: String 
    }],
    picture,
}, { timestamps: true });

module.exports = mongoose.model("Playlists", playlistSchema);