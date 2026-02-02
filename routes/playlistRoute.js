const express = require('express');
const router = express.Router();
const db = require("./service.js");
const crypto = require('crypto');

router.post('/api/playlist/add', authenticationCheck, async function (req, res) {
    let data = req.body;
    let userId = res.locals.userID;

    db.addPlaylist(data.name, data.description, data.tracks, userId)
        .then(response => res.status(200).json({ message: response }))
        .catch(error => res.status(500).json({ message: error.message }));
});

// Get single playlist
router.get('/api/playlist/:id', async function (req, res) {
    db.getPlaylist(req.params.id)
        .then(response => {
            if (!response) res.status(404).json({ message: "Playlist not found" });
            else res.status(200).json(response);
        })
        .catch(error => res.status(500).json({ message: error.message }));
});

// Update playlist (only creator)
router.put('/api/playlist/:id', authenticationCheck, async function (req, res) {
    let playlistId = req.params.id;
    let userId = res.locals.userID;

    db.updatePlaylist(playlistId, userId, req.body)
        .then(response => res.status(200).json({ message: response }))
        .catch(error => res.status(500).json({ message: error.message }));
});

// Delete playlist (only creator)
router.delete('/api/playlist/:id', authenticationCheck, async function (req, res) {
    let playlistId = req.params.id;
    let userId = res.locals.userID;

    db.deletePlaylist(playlistId, userId)
        .then(response => res.status(200).json({ message: response }))
        .catch(error => res.status(500).json({ message: error.message }));
});

// Add song to playlist
router.post('/api/playlist/:id/add', authenticationCheck, async (req, res) => {
    try {
        let playlistId = req.params.id;
        let userId = res.locals.userID;
        let songId = req.body.songId;

        let result = await db.addTrackToPlaylist(playlistId, userId, songId);
        res.status(200).json({ message: result });

    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Remove song from playlist
router.post('/api/playlist/:id/remove', authenticationCheck, async (req, res) => {
    try {
        let playlistId = req.params.id;
        let userId = res.locals.userID;
        let songId = req.body.songID;

        let result = await db.removeTrackFromPlaylist(playlistId, userId, songId);
        res.status(200).json({ message: result });

    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});