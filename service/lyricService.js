const lyrics = require('../models/lyrics.js');
const axios = require('axios');
const cheerio = require('cheerio');

const GeniusApi = new SpotifyWebApi({
  clientId: process.env.GENIUS_CLIENT_ID,
  clientSecret: process.env.GENIUS_CLIENT_SECRET,
});

const lyricsService = {
    
};

module.exports = lyricsService;