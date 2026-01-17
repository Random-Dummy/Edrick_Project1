const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  tracks: [{
    spotifyTrackId: { type: String, required: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    duration: Number,
    album: { type: String, default: function () { return this.title; } },
    image: String
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Playlists', playlistSchema);