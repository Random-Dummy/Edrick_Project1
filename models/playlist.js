const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    tracks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Songs',
        required: true
    }],
    createdAt: { type: Date, default: Date.now },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
});

module.exports = mongoose.model('Playlists', playlistSchema);