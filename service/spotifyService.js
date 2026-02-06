const SpotifyWebApi = require('spotify-web-api-node');
const lyricService = require('./lyricService.js');
require('dotenv').config({ path: './config.env' });

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

let tokenRefreshTimeout = null;

const refreshAccessToken = async () => {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);

        console.log(`Access token refreshed. Expires in ${data.body['expires_in']} seconds`);
        if (tokenRefreshTimeout) {
            clearTimeout(tokenRefreshTimeout);
        }

        // Refresh 1 minute before expiry
        tokenRefreshTimeout = setTimeout(
            refreshAccessToken,
            (data.body['expires_in'] - 60) * 1000
        );

    } catch (error) {
        console.error('Error refreshing access token:', error.message);
        // Retry after 10 seconds if failed
        setTimeout(refreshAccessToken, 10000);
    }
};

// Initialize
refreshAccessToken().catch(console.error);

const spotifyService = {
    // Login to user's spotify account
    getAuthURL(userId) {
        const scopes = ['user-top-read', 'user-read-private', 'user-read-email', 'user-read-recently-played'];
        const state = userId.toString();
        // Create a temporary instance to generate URL
        const tempApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            redirectUri: process.env.REDIRECT_URI
        });
        return tempApi.createAuthorizeURL(scopes, state, 'true');
    },
    // Handle the callback code and save spotify tokens
    async authorizeUser(code) {

        const tempApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            redirectUri: process.env.REDIRECT_URI
        });

        try {
            const data = await tempApi.authorizationCodeGrant(code);
            return {
                accessToken: data.body['access_token'],
                refreshToken: data.body['refresh_token'],
                expiresIn: data.body['expires_in']
            };
        } catch (error) {
            console.error('Error authorizing user:', error);
            throw error;
        }
    },
    async getUserStats(refreshToken) {
        const userApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            refreshToken: refreshToken
        });

        try {
            const data = await userApi.refreshAccessToken();
            userApi.setAccessToken(data.body['access_token']);

            // Calculate Hours Played from recent tracks
            const recentTracks = await userApi.getMyRecentlyPlayedTracks({ limit: 50 });
            let totalDurationMs = 0;
            recentTracks.body.items.forEach(item => {
                totalDurationMs += item.track.duration_ms;
            });
            const hoursPlayed = (totalDurationMs / (1000 * 60 * 60)).toFixed(1);

            // Top Tracks last month
            const topTracksMonth = await userApi.getMyTopTracks({ limit: 10, time_range: 'short_term' });

            // Top Tracks all time
            const topTracksAllTime = await userApi.getMyTopTracks({ limit: 20, time_range: 'long_term' });

            // Top Artists all time
            const topArtistsAllTime = await userApi.getMyTopArtists({ limit: 15, time_range: 'long_term' });

            // Helper to format track data
            const formatTrack = (track) => ({
                name: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                album: track.album.name,
                image: track.album.images[0] ? track.album.images[0].url : null,
                url: track.external_urls.spotify
            });

            return {
                hoursPlayed: hoursPlayed,
                recentTrackCount: recentTracks.body.items.length,
                topTracksMonth: topTracksMonth.body.items.map(formatTrack),
                topTracksAllTime: topTracksAllTime.body.items.map(formatTrack),
                topArtistsAllTime: topArtistsAllTime.body.items.map(artist => ({
                    name: artist.name,
                    image: artist.images[0] ? artist.images[0].url : null,
                    url: artist.external_urls.spotify
                }))
            };
        } catch (error) {
            console.error('Error fetching user stats:', error);
            throw new Error('Failed to fetch user stats');
        }
    },

    // Search for tracks on Spotify
    async searchTracks(query, limit = 50) {
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
    },

    async getTasteInsights(refreshToken, timeRange = 'medium_term') {
        const userApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            refreshToken
        });

        try {
            const data = await userApi.refreshAccessToken();
            userApi.setAccessToken(data.body['access_token']);

            // 1. Get top tracks
            const topTracksRes = await userApi.getMyTopTracks({
                limit: 20,
                time_range: timeRange
            });

            const topTracks = topTracksRes.body.items;
            const trackIds = topTracks.map(t => t.id);

            // 2. Get audio features
            const audioFeaturesRes = await userApi.getAudioFeaturesForTracks(trackIds);
            const audioFeatures = audioFeaturesRes.body.audio_features.filter(Boolean);

            // 3. Calculate averages
            const avg = (key) =>
                audioFeatures.reduce((sum, t) => sum + (t[key] || 0), 0) / audioFeatures.length;

            const tasteProfile = {
                danceability: Number(avg('danceability').toFixed(2)),
                energy: Number(avg('energy').toFixed(2)),
                valence: Number(avg('valence').toFixed(2)),
                acousticness: Number(avg('acousticness').toFixed(2)),
                instrumentalness: Number(avg('instrumentalness').toFixed(2)),
                tempo: Number(avg('tempo').toFixed(1))
            };

            // 4. Optional mood labels
            const mood = this._inferMood(tasteProfile);

            return {
                tasteProfile,
                mood,
                topTracks: topTracks.map(track => ({
                    name: track.name,
                    artist: track.artists.map(a => a.name).join(', '),
                    image: track.album.images[0]?.url || null
                }))
            };

        } catch (error) {
            console.error('Error fetching taste insights:', error);
            throw new Error('Failed to fetch taste insights');
        }
    },

    async getTrackWithLyrics(trackId) {
        try {
            // Get track details from Spotify
            const trackDetails = await spotifyService.getTrackDetails(trackId);

            if (!trackDetails) {
                return {
                    success: false,
                    message: 'Track not found on Spotify'
                };
            }

            // Get lyrics
            const lyricsResult = await lyricService.getLyrics(
                trackId,
                trackDetails.name,
                trackDetails.artist
            );

            return {
                success: true,
                spotify: trackDetails,
                lyrics: lyricsResult
            };

        } catch (error) {
            console.error('Error getting track with lyrics:', error);
            return {
                success: false,
                message: 'Failed to get track with lyrics',
                error: error.message
            };
        }
    }

};

module.exports = spotifyService;