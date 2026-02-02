const axios = require("axios");

const getLyrics = async (artist, title) => {
  const response = await axios.get(
    `https://api.genius.com/search?q=${artist} ${title}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GENIUS_API_KEY}`
      }
    }
  );

  return response.data.response.hits;
};

module.exports = { getLyrics };
