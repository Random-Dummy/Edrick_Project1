const axios = require("axios");

const searchSpotifyTracks = async (query, accessToken) => {
  const response = await axios.get(
    "https://api.spotify.com/v1/search",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      params: {
        q: query,
        type: "track",
        limit: 10
      }
    }
  );

  return response.data.tracks.items.map(track => ({
    spotifyTrackId: track.id,
    title: track.name,
    artist: track.artists.map(a => a.name).join(", "),
    album: track.album.name,
    imageUrl: track.album.images[0]?.url,
    previewUrl: track.preview_url
  }));
};

module.exports = { searchSpotifyTracks };
