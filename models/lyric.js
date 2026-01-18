const mongoose = require('mongoose');

const lyricsSchema = new mongoose.Schema({
  spotifyTrackId: { type: String, required: true, unique: true },
  songName: String,
  artistName: String,
  lyrics: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Lyrics', lyricsSchema);
