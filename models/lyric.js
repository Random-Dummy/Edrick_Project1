const mongoose = require('mongoose');

const lyricsSchema = new mongoose.Schema({
    song: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Songs',
        required: true
    },
    lyrics: String,
});

module.exports = mongoose.model('Lyrics', lyricsSchema);