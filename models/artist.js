Artist
- id
- name
- spotifyArtistId
- geniusArtistId
- images
- genres
- popularity
- followers

const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    spotifyArtistId: { type: String, required: true, unique: true },
    geniusArtistId: { type: String, unique: true },
    images: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Artists', artistSchema);