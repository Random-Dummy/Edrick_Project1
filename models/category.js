const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  playlists: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Playlists',
      required: true
    }],
  creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);