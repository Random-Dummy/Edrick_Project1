const mongoose = require('mongoose');

const likedSongsSchema = new mongoose.Schema({
     tracks: [{
        spotifyTrackId: { type: String, required: true },
        name: { type: String, required: true },
        artist: { type: String, required: true },
        album: String,
        durationMs: Number,
        albumImage: String 
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    }
});

module.exports = mongoose.model('LikedSongs', likedSongsSchema);