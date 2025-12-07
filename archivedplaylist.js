const mongoose = require('mongoose');
const playlist = require('./playlist.js');
const user = require('./user.js');

const archivedPlaylistSchema = new mongoose.Schema({
  // Relationship to user
  user:{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'users', 
    required: true
  },
  // Relationship to original playlist
  playlist: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'playlists', 
    required: true 
  },
  
  name: { 
    type: String, 
    required: true 
  },
  
  archivedAt: { 
    type: Date, 
    default: Date.now 
  },
  
  tracks: [{
    trackId: String,
    name: String,
    artist: String,
    previewUrl: String
  }]
});

module.exports = mongoose.model('ArchivedPlaylist', archivedPlaylistSchema);