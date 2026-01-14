const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  spotifyTrackId: { type: String, required: true },
  title: String,
  artist: String,
  album: String,
  imageUrl: String,
  previewUrl: String
}, { timestamps: true });

module.exports = mongoose.model('Track', trackSchema);
