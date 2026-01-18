const mongoose = require('mongoose');
const user = require('./user.js');
const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  picture: { type: String, default: 'https://example.com/default-playlist-image.png' },
  tracks: [{
    spotifyTrackId: { type: String, required: true },
    name: { type: String, required: true },
    artist: { type: String, required: true },
    duration: Number,
    album: { type: String, default: function () { return this.name; } },
    image: String
  }],
}, { timestamps: true });

module.exports = mongoose.model('Playlists', playlistSchema);