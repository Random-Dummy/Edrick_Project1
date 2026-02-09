const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    playlistpicture: {
        type: String,
        default: ''
    },
    tracks: [{
        spotifyTrackId: String,
        name: String,
        artist: String,
        album: String,
        durationMs: Number,
        albumImage: String
    }],
    isPublic: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    cloneCount: {
        type: Number,
        default: 0
    },
    originalPlaylistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist',
        default: null
    }
});

module.exports = mongoose.model('Playlists', playlistSchema);
