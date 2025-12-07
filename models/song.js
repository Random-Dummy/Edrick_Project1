const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    songID: { type: String, required: true },
    title: { type: String, required: true },
    artist: String,
    album: { type: String,
        default: function() { return this.title; } },
    previewUrl: String,
    duration: String,
});

module.exports = mongoose.model('Songs', songSchema);