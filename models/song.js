const songSchema = new mongoose.Schema({
  spotifyTrackId: { type: String, required: true, unique: true },
  name: String,
  artists: [{
    name: String,
    spotifyArtistId: String
  }],
  album: {
    name: String,
    spotifyAlbumId: String,
    imageUrl: String
  },
  previewUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('Songs', songSchema);