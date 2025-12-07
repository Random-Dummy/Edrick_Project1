const mongoose = require('mongoose');

const cachedLyricsSchema = new mongoose.Schema({
  spotifyTrackId: String,    
  lyrics: String,            
  cachedAt: Date             
});

module.exports = mongoose.model('CachedLyrics', cachedLyricsSchema);