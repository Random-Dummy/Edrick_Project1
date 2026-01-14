const lyricsSchema = new mongoose.Schema({
  spotifyTrackId: { type: String, required: true, unique: true },
  trackName: String,
  artistName: String,
  lyrics: { type: String, required: true },
  source: {
    type: String,
    enum: ['genius'],
    default: 'genius'
  }
}, { timestamps: true });

module.exports = mongoose.model('Lyrics', lyricsSchema);
