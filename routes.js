const express = require('express');
const router = express.Router();
const db = require("./service.js");
const crypto = require('crypto');

db.connect()
.then(function(response){
    console.log(response);
})
.catch(function(error){
    console.log(error.message);
});

router.use(express.urlencoded({
    extended: true
}));

// User Auth & Account Management
function authenticationCheck(req,res,next) {
    let token = req.query.token;
    if(!token) {
        res.status(401).json({"message":"No tokens are provided."});
    } else {
        db.checkToken(token)
        .then(function(response){
            if(response) {
                res.locals.userID = response._id;
                next();
            } else {
                res.status(401).json({"message":"Invalid token provided."});
            }
        })
        .catch(function(error){
            res.status(500).json({"message":error.message});
        });
    }
}

router.get('/api/organizer/logout',authenticationCheck);

router.post('/api/user/login',function(req,res){
    let data = req.body;
    db.getUser(data.username,data.password)
    .then(function(response){
        if(!response) {
            res.status(401).json({"message":"Login unsuccessful. Please try again later."});
        } 
        else {
            let strToHash = response.username + Date.now();
            let token = crypto.createHash('md5').update(strToHash).digest('hex');
            db.updateToken(response._id,token)
            .then(function(response){
                res.status(200).json({'message':'Login successful','token':token});
            })
            .catch(function(error){
                res.status(500).json({"message":error.message});
            })
        }   
    })
    .catch(function(error){
        res.status(500).json({"message":error.message});
    })
})

router.get('/api/user/logout', authenticationCheck,function(req,res){
    //retrieve the id that was stored earlier in the middleware.
    let id = res.locals.userID;
    db.removeToken(id)
    .then(function(response){
        res.status(200).json({'message':'Logout successful'});
    })
    .catch(function(error){
        res.status(500).json({"message":error.message});
    })
})

// User CRUD
router.post('/api/user/register', function (req, res) {
    let data = req.body;
    db.addUser(data.username, data.email, data.password)
    .then(function(response){
        res.status(200).json({"message":response});
    })
    .catch(function(error){
        res.status(500).json({"message":error.message});
    });
})

// Song CRUD
router.post('/api/song', function (req, res) {
    let data = req.body;
    db.addSong(data.title,  data.artist, data.album, data.previewUrl,  data.duration)
    .then(function(response){
        res.status(200).json({"message":response});
    })
    .catch(function(error){
        res.status(500).json({"message":error.message});
    });
})

//Check here
// Get all songs
router.get('/api/songs', async (req, res) => {
    try {
        let results = await db.getAllSongs();
        res.status(200).json(results);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// get via ID
router.get('/api/song/:id', async (req, res) => {
    try {
        let result = await db.getSong(req.params.id);
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// update via ID
router.put('/api/song/:id', async (req, res) => {
    try {
        let result = await db.updateSong(req.params.id, req.body);
        res.status(200).json({ message: result });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// DELETE Song
router.delete('/api/song/:id', async (req, res) => {
    try {
        let result = await db.deleteSong(req.params.id);
        res.status(200).json({ message: result });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Lyrics CRUD
// CREATE Lyrics
router.post('/api/lyrics', async (req, res) => {
    try {
        let result = await db.addLyrics(req.body.song, req.body.lyrics);
        res.status(200).json({ message: result });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// READ Lyrics by Song
router.get('/api/lyrics/:songId', async (req, res) => {
    try {
        let result = await db.getLyrics(req.params.songId);
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// UPDATE Lyrics
router.put('/api/lyrics/:id', async (req, res) => {
    try {
        let result = await db.updateLyrics(req.params.id, req.body.lyrics);
        res.status(200).json({ message: result });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// DELETE Lyrics
router.delete('/api/lyrics/:id', async (req, res) => {
    try {
        let result = await db.deleteLyrics(req.params.id);
        res.status(200).json({ message: result });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// PLAYLIST CRUD (Protected)
router.post('/api/playlist', authenticationCheck, async function(req, res) {
    let data = req.body;
    let userId = res.locals.userID;

    db.addPlaylist(data.name, data.description, data.tracks, userId)
    .then(response => res.status(200).json({ message: response }))
    .catch(error => res.status(500).json({ message: error.message }));
});

router.get('/api/playlist/:id', async function(req, res) {
    db.getPlaylist(req.params.id)
    .then(response => {
        if (!response) res.status(404).json({ message: "Playlist not found" });
        else res.status(200).json(response);
    })
    .catch(error => res.status(500).json({ message: error.message }));
});

// UPDATE PLAYLIST (only creator)
router.put('/api/playlist/:id', authenticationCheck, async function(req, res) {
    let playlistId = req.params.id;
    let userId = res.locals.userID;

    db.updatePlaylist(playlistId, userId, req.body)
    .then(response => res.status(200).json({ message: response }))
    .catch(error => res.status(500).json({ message: error.message }));
});

// DELETE PLAYLIST (only creator)
router.delete('/api/playlist/:id', authenticationCheck, async function(req, res) {
    let playlistId = req.params.id;
    let userId = res.locals.userID;

    db.deletePlaylist(playlistId, userId)
    .then(response => res.status(200).json({ message: response }))
    .catch(error => res.status(500).json({ message: error.message }));
});

module.exports = router;