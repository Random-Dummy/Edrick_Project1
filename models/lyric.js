const mongoose = require('mongoose');

const lyricsSchema = new mongoose.Schema({
    spotifySongId: { type: String, required: true },
    trackName: String,
    artistName: String,
    lyrics: String
});

module.exports = mongoose.model('Lyrics', lyricsSchema);