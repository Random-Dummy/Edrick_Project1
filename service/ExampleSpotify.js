const SpotifyWebApi = require('spotify-web-api-node');

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Token management
let tokenRefreshTimeout = null;

const refreshAccessToken = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    
    console.log(`Access token refreshed. Expires in ${data.body['expires_in']} seconds`);
    
    // Clear existing timeout and set new one
    if (tokenRefreshTimeout) {
      clearTimeout(tokenRefreshTimeout);
    }
    
    // Refresh 60 seconds before expiry
    tokenRefreshTimeout = setTimeout(
      refreshAccessToken, 
      (data.body['expires_in'] - 60) * 1000
    );
    
  } catch (error) {
    console.error('Error refreshing access token:', error.message);
    // Retry after 30 seconds if failed
    setTimeout(refreshAccessToken, 30000);
  }
};

// Initialize with first token
refreshAccessToken().catch(console.error);

const spotifyService = {
  // Search for tracks on Spotify
  async searchTracks(query, limit = 20) {
    try {
      const response = await spotifyApi.searchTracks(query, {
        limit: limit,
        market: 'US'
      });

      // Format the results
      const tracks = response.body.tracks.items.map(function (track) {
        return {
          spotifyTrackId: track.id,
          name: track.name,
          artist: track.artists.map(function (artist) {
            return artist.name;
          }).join(', '),
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
        tracks: tracks
      };

    } catch (error) {
      console.error('Spotify API Error:', error.message);
      return {
        success: false,
        error: 'Failed to search Spotify',
        tracks: []
      };
    }
  },

  // Get specific track details
  async getTrackDetails(trackId) {
    try {
      const response = await spotifyApi.getTrack(trackId);
      const track = response.body;
      
      return {
        spotifyTrackId: track.id,
        name: track.name,
        artist: track.artists.map(function (artist) {
          return artist.name;
        }).join(', '),
        album: track.album.name,
        durationMs: track.duration_ms,
        albumImage: track.album.images[0] ? track.album.images[0].url : null
      };

    } catch (error) {
      console.error('Spotify API Error:', error.message);
      return null;
    }
  }
};

module.exports = spotifyService;