const express = require('express');
const router = express.Router();
const db = require("./service/dbservice.js");
const crypto = require('crypto');
const userService = require('./service/userService.js');
const playlistService = require('./service/playlistService.js');
const likedSongService = require('./service/likedSongService.js');
const lyricService = require('./service/lyricService.js');
const spotifyService = require('./service/spotifyService.js');

db.connect()
    .then(function (response) {
        console.log(response);
    })
    .catch(function (error) {
        console.log(error.message);
    });

router.use(express.urlencoded({
    extended: true
}));

//need this if you are sending json data in the request body
router.use(express.json());

// USER STUFF ===============================================================================================================
function authenticationCheck(req, res, next) {
    let token = req.query.token;
    if (!token) {
        return res.status(401).json({ "message": "No tokens are provided." });
    }

    userService.checkToken(token)
        .then(function (response) {
            if (response) {
                res.locals.userId = response._id;
                next();
            } else {
                return res.status(401).json({ "message": "Invalid token provided." });
            }
        })
        .catch(function (error) {
            return res.status(500).json({ "message": error.message });
        });
}

// Login
router.post('/user/login', function (req, res) {
    let data = req.body;
    userService.userLogin(data.email, data.password)
        .then(function (response) {
            if (!response) {
                res.status(401).json({ "message": "Login unsuccessful. Please try again later." });
            }
            else {
                let strToHash = response.email + Date.now();
                let token = crypto.createHash('md5').update(strToHash).digest('hex');
                userService.updateToken(response._id, token)
                    .then(function (response) {
                        res.status(200).json({ 'message': 'Login successful', 'token': token });
                    })
                    .catch(function (error) {
                        res.status(500).json({ "message": error.message });
                    })
            }
        })
        .catch(function (error) {
            res.status(500).json({ "message": error.message });
        })
})

// Logout
router.get('/user/logout', authenticationCheck, async function (req, res) {
    let userId = res.locals.userId;

    try {
        await userService.removeToken(userId);
        res.status(200).json({ "message": 'Logout Successful' });
    } catch (error) {
        console.error('Error in user logout route:', error.message);
        res.status(500).json({ "message": "Logout failed: " + error.message });
    }
});

// Register
router.post('/user/register', async function (req, res) {
    let { username, email, password } = req.body;
    userService.createUser(username, email, password)
        .then(function (newUser) {
            res.status(200).json({ "message": "User created successfully", "user": newUser });
        })
        .catch(function (error) {
            console.error("Error in /users/register:", error.message);
            res.status(500).json({ "message": "Failed to create user", "error": error.message });
        });
});

router.get('/user', authenticationCheck, async function (req, res) {
    try {
        const userId = res.locals.userId;
        const userData = await userService.getUserbyId(userId);
        console.log("Fetched userData:", userData); // <-- add this
        if (!userData) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            success: true,
            email: userData.email,
            username: userData.username,
            userpicture: userData.userpicture
        });
    } catch (error) {
        console.error('Error getting user information:', error);
        res.status(500).json({ message: "Failed to get user information: " + error.message });
    }
});

router.put('/user', authenticationCheck, async function (req, res) {
    let userId = res.locals.userId;
    let data = req.body; // Can include username, password, etc.
    try {
        const updatedUser = await userService.updateUser(userId, data);
        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user information:', error.message);
        res.status(500).json({ message: "Failed to update user information: " + error.message });
    }
});

// Playlist stuff ===============================================================================================================

// Create Playlist
router.post('/playlists/create', authenticationCheck, async function (req, res) {
    let { name, description, track } = req.body; // Added description
    let userId = res.locals.userId;

    playlistService.createPlaylist(name, userId, description || '', track)
        .then(function (response) {
            res.status(200).json({ "message": response });
        })
        .catch(function (error) {
            console.error("Error creating playlist:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

// Get Playlists
router.get('/playlists', authenticationCheck, async function (req, res) {
    let userId = res.locals.userId;

    playlistService.getPlaylist(userId)
        .then(function (playlists) {
            res.status(200).json({ "playlists": playlists });
        })
        .catch(function (error) {
            console.error("Error getting playlists:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

// Get tracks of a specific playlist
router.get('/playlists/:playlistId/tracks', authenticationCheck, async function (req, res) {
    const userId = res.locals.userId;
    const playlistId = req.params.playlistId;

    try {
        const playlist = await playlistService.getPlaylistById(playlistId, userId);
        if (!playlist) {
            return res.status(404).json({ success: false, message: "Playlist not found" });
        }

        res.status(200).json({
            tracks: (playlist.tracks || []).map(t => ({
                spotifyTrackId: t.spotifyTrackId,
                name: t.name,
                artist: t.artist,
                album: t.album,
                albumImage: t.albumImage,
                durationMs: t.durationMs
            }))
        });
    } catch (error) {
        console.error("Error fetching playlist tracks:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update Playlist
router.put('/playlists/:playlistId', authenticationCheck, async function (req, res) {
    let userId = res.locals.userId;
    let playlistId = req.params.playlistId;
    let data = req.body; // Can include name, picture, etc.

    playlistService.updatePlaylist(playlistId, userId, data)
        .then(function (updatedPlaylist) {
            res.status(200).json({
                "message": "Playlist updated successfully",
                "playlist": updatedPlaylist
            });
        })
        .catch(function (error) {
            console.error("Error updating playlist:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

// Delete Playlist
router.delete('/playlists/:playlistId', authenticationCheck, async function (req, res) {
    let userId = res.locals.userId;
    let playlistId = req.params.playlistId;

    playlistService.deletePlaylist(playlistId, userId)
        .then(function (response) {
            res.status(200).json({ "message": response });
        })
        .catch(function (error) {
            console.error("Error deleting playlist:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

// Add track to playlist
router.post('/playlists/:playlistId/tracks', authenticationCheck, async function (req, res) {
    let userId = res.locals.userId;
    let playlistId = req.params.playlistId;
    let track = req.body; // Should contain track data

    playlistService.addToPlaylist(playlistId, userId, track)
        .then(function (response) {
            res.status(200).json({ "message": response });
        })
        .catch(function (error) {
            console.error("Error adding track to playlist:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

// Remove track from playlist
router.delete('/playlists/:playlistId/tracks/:spotifyTrackId', authenticationCheck, async function (req, res) {
    let userId = res.locals.userId;
    let playlistId = req.params.playlistId;
    let spotifyTrackId = req.params.spotifyTrackId;

    playlistService.removeFromPlaylist(playlistId, userId, spotifyTrackId)
        .then(function (response) {
            res.status(200).json({ "message": response });
        })
        .catch(function (error) {
            console.error("Error removing track from playlist:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

// Liked Songs stuff ===============================================================================================================

// Add song to liked songs
router.post('/liked-songs', authenticationCheck, async function (req, res) {
    let userId = res.locals.userId;
    let { spotifyTrackId } = req.body;

    if (!spotifyTrackId) {
        return res.status(400).json({ "message": "spotifyTrackId is required" });
    }

    likedSongService.addLikedSong(userId, spotifyTrackId)
        .then(function (response) {
            if (response.success) {
                res.status(200).json(response);
            } else {
                res.status(400).json(response);
            }
        })
        .catch(function (error) {
            console.error("Error adding liked song:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

// Remove song from liked songs
router.delete('/liked-songs/:spotifyTrackId', authenticationCheck, async function (req, res) {
    let userId = res.locals.userId;
    let spotifyTrackId = req.params.spotifyTrackId;

    likedSongService.removeLikedSong(userId, spotifyTrackId)
        .then(function (response) {
            if (response.success) {
                res.status(200).json(response);
            } else {
                res.status(400).json(response);
            }
        })
        .catch(function (error) {
            console.error("Error removing liked song:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

// Get liked songs with lyrics
router.get('/liked-songs/with-lyrics', authenticationCheck, async function (req, res) {
    let userId = res.locals.userId;

    likedSongService.getLikedSongsWithLyrics(userId)
        .then(function (response) {
            if (response.success) {
                res.status(200).json(response);
            } else {
                res.status(404).json(response);
            }
        })
        .catch(function (error) {
            console.error("Error getting liked songs with lyrics:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

router.get('/liked-songs', authenticationCheck, async function (req, res) {
    try {
        const userId = res.locals.userId;
        const result = await likedSongService.getUserLikedSongs(userId);
        if (result.success) {
            res.status(200).json({
                success: true,
                count: result.count,
                likedSongs: result.tracks,
                message: result.message
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error in get liked songs route:', error.message);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve liked songs: " + error.message
        });
    }
});

// Lyrics stuff ===============================================================================================================

// Get lyrics for a specific track
router.get('/lyrics/:spotifyTrackId', authenticationCheck, async function (req, res) {
    let spotifyTrackId = req.params.spotifyTrackId;
    let { songName, artist } = req.query; // Optional query parameters

    lyricService.getLyrics(spotifyTrackId, songName, artist)
        .then(function (response) {
            if (response.success) {
                res.status(200).json(response);
            } else {
                res.status(404).json(response);
            }
        })
        .catch(function (error) {
            console.error("Error getting lyrics:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

// Batch get lyrics for multiple tracks
router.post('/lyrics/batch', authenticationCheck, async function (req, res) {
    let { tracks } = req.body; // Array of track objects

    if (!tracks || !Array.isArray(tracks)) {
        return res.status(400).json({ "message": "tracks array is required" });
    }

    lyricService.batchGetLyrics(tracks)
        .then(function (results) {
            res.status(200).json({
                success: true,
                results: results
            });
        })
        .catch(function (error) {
            console.error("Error batch getting lyrics:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

// Search lyrics
router.get('/lyrics/search/:query', authenticationCheck, async function (req, res) {
    let query = req.params.query;

    if (!query || query.trim().length < 2) {
        return res.status(400).json({ "message": "Search query must be at least 2 characters" });
    }

    lyricService.searchLyrics(query)
        .then(function (response) {
            res.status(200).json(response);
        })
        .catch(function (error) {
            console.error("Error searching lyrics:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

// Delete cached lyrics (admin/utility)
router.delete('/lyrics/cache/:spotifyTrackId', authenticationCheck, async function (req, res) {
    let spotifyTrackId = req.params.spotifyTrackId;

    lyricService.deleteCachedLyrics(spotifyTrackId)
        .then(function (response) {
            res.status(200).json(response);
        })
        .catch(function (error) {
            console.error("Error deleting cached lyrics:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

// Get Genius API status (admin/utility)
router.get('/lyrics/genius-status', authenticationCheck, async function (req, res) {
    lyricService.getGeniusStatus()
        .then(function (response) {
            res.status(200).json(response);
        })
        .catch(function (error) {
            console.error("Error getting Genius status:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

// Spotify stuff ===============================================================================================================

router.get('/spotify/search', authenticationCheck, async function (req, res) {
    let { query, limit } = req.query;
    if (!query) {
        return res.status(400).json({ "message": "Search query is required" });
    }
    spotifyService.searchTracks(query, limit || 20)
        .then(function (response) {
            res.status(200).json(response);
        })
        .catch(function (error) {
            console.error("Error searching Spotify:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

// Get track details from Spotify
router.get('/spotify/track/:trackId', authenticationCheck, async function (req, res) {
    let trackId = req.params.trackId;
    spotifyService.getTrackDetails(trackId)
        .then(function (trackDetails) {
            if (trackDetails) {
                res.status(200).json({
                    success: true,
                    track: trackDetails
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: "Track not found on Spotify"
                });
            }
        })
        .catch(function (error) {
            console.error("Error getting track details:", error.message);
            res.status(500).json({ "message": error.message });
        });
});

// Spotify Connect (OAuth redirect)
// Redirect user to Spotify login
router.get('/spotify/connect', authenticationCheck, (req, res) => {
    try {
        const userId = res.locals.userId;
        const authURL = spotifyService.getAuthURL(userId); // ensure spotifyService has getAuthURL
        res.json({ success: true, url: authURL });
    } catch (error) {
        console.error("Error in /spotify/connect:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Spotify OAuth callback
router.get('/spotify/callback', async (req, res) => {
    const { code, state } = req.query; // state = userId
    if (!code || !state) {
        return res.status(400).send("Invalid callback parameters");
    }

    try {
        const tokens = await spotifyService.authorizeUser(code);

        // Save Spotify tokens in DB
        await userService.saveSpotifyTokens(state, tokens.accessToken, tokens.refreshToken);

        res.redirect(`/profile.html?spotify=connected`);
    } catch (err) {
        console.error("Spotify callback error:", err.message);
        res.redirect(`/profile.html?spotify=error`);
    }
});

// Spotify Stats
// Spotify Stats
router.get('/spotify/stats', authenticationCheck, async (req, res) => {
    try {
        const userId = res.locals.userId;
        // Get the user's Spotify refresh token from DB
        const refreshToken = await userService.getSpotifyRefreshToken(userId);
        if (!refreshToken) {
            return res.json({ success: true, connected: false });
        }
        // Fetch Spotify stats using the refresh token
        const stats = await spotifyService.getUserStats(refreshToken);
        res.json({ success: true, connected: true, stats });
    } catch (error) {
        console.error("Error fetching Spotify stats:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch Spotify stats" });
    }
});

module.exports = router;