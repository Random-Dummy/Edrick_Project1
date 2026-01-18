const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

const refreshAccessToken = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    const accessToken = data.body['access_token'];
    const expiresIn = data.body['expires_in'];

    spotifyApi.setAccessToken(accessToken);
    console.log(`Spotify access token refreshed. Expires in ${expiresIn} seconds.`);

    // Next refresh 1 minute before expiry
    setTimeout(refreshAccessToken, (expiresIn - 60) * 1000);
  } catch (err) {
    console.error('Error refreshing Spotify access token:', err.message);
    setTimeout(refreshAccessToken, 10000); // Retry after 10 seconds on failure
  }
};

// Initial refresh
refreshAccessToken().catch(console.error);

const spotifyService = {
  async searchTracks(query, limit = 25) {
    try {
      const response = await spotifyApi.searchTracks(query, { limit: limit, market: 'US' });
      // Result mapping
      const songs = response.body.tracks.items.map(function (track) {
        return {
          spotifyTrackId: track.id,
          name: track.name,
          artist: track.artists.map(artist => artist.name).join(', '),
          album: track.album.name,
          durationMs: track.duration_ms,
          albumImage: track.album.images[0] ? track.album.images[0].url : null,
          popularity: track.popularity,
          externalUrl: track.external_urls.spotify
        };
      });
      return {
        success: true,
        query: query,
        totalResults: response.body.tracks.total,
        songs: songs
      };
    } catch (error) {
      console.error('Spotify API Error:', error.message);
      return {
        success: false,
        error: 'Failed to search Spotify',
        songs: []
      };
    }
  },

  async getTrackById(id) {
    try {
      const response = await spotifyApi.getTrack(id);
      const track = response.body;
      return {
        spotifyTrackId: track.id,
        name: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        album: track.album.name,
        durationMs: track.duration_ms,
        albumImage: track.album.images[0] ? track.album.images[0].url : null,
        popularity: track.popularity,
        externalUrl: track.external_urls.spotify
      }
    } catch (error) {
      console.error('Spotify API Error:', error.message);
      return null;
    }
  }
};

module.exports = spotifyService;