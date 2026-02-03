const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    tracks: [{
        spotifyTrackId: { type: String, required: true },
        name: { type: String, required: true },
        artist: { type: String, required: true },
        album: {
            type: String,
            default: function () {
                return this.name; // Default album to the song's name
            }
        },
        durationMs: Number,
        albumImage: String
    }],
    picture: String,
}, { timestamps: true });

module.exports = mongoose.model("Playlists", playlistSchema);