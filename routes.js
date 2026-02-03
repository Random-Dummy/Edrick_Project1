const express = require('express');
const router = express.Router();
const db = require("./service/dbservice.js");
const crypto = require('crypto');
const userService = require('./service/userService.js');
const playlistService = require('./service/playlistService.js');

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

//need this if you are sending json data in the request body
router.use(express.json());

// USER STUFF ===============================================================================================================
function authenticationCheck(req,res,next) {
    //check if query token is in the url
    let token = req.query.token;
    if(!token) {
        res.status(401).json({"message":"No tokens are provided."});
    } else {
        userService.checkToken(token)
        .then(function(response){
            //Matched token in the db, proceed with the request
            if(response) {
                //response = user who is logged in.
                // store the user's id in local memory to be used in the route handler
                res.locals.userId = response._id;
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

// Login
router.post('/user/login',function(req,res){
    let data = req.body;
    userService.userLogin(data.email,data.password)
    .then(function(response){
        if(!response) {
            res.status(401).json({"message":"Login unsuccessful. Please try again later."});
        } 
        else {
            let strToHash = response.email + Date.now();
            let token = crypto.createHash('md5').update(strToHash).digest('hex');
            userService.updateToken(response._id,token)
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
router.post('/user/register', async function(req, res){
    let { username, email, password } = req.body;
    userService.createUser(username, email, password)
    .then(function(newUser){
        res.status(200).json({ "message": "User created successfully", "user": newUser });
    })
    .catch(function(error){
        console.error("Error in /users/register:", error.message);
        res.status(500).json({ "message": "Failed to create user", "error": error.message });
    });
});

// Playlist stuff ===============================================================================================================

// Create Playlist
router.post('/playlists/create', authenticationCheck, async function(req, res) {
    let { name, track } = req.body;
    let userId = res.locals.userId;
    
    playlistService.createPlaylist(name, userId, track)
    .then(function(response) {
        res.status(200).json({ "message": response });
    })
    .catch(function(error) {
        console.error("Error creating playlist:", error.message);
        res.status(500).json({ "message": error.message });
    });
});

// Get Playlists
router.get('/playlists', authenticationCheck, async function(req, res) {
    let userId = res.locals.userId;
    
    playlistService.getPlaylist(userId)
    .then(function(playlists) {
        res.status(200).json({ "playlists": playlists });
    })
    .catch(function(error) {
        console.error("Error getting playlists:", error.message);
        res.status(500).json({ "message": error.message });
    });
});

// Update Playlist
router.put('/playlists/:playlistId', authenticationCheck, async function(req, res) {
    let userId = res.locals.userId;
    let playlistId = req.params.playlistId;
    let data = req.body; // Can include name, picture, etc.
    
    playlistService.updatePlaylist(playlistId, userId, data)
    .then(function(updatedPlaylist) {
        res.status(200).json({ 
            "message": "Playlist updated successfully",
            "playlist": updatedPlaylist 
        });
    })
    .catch(function(error) {
        console.error("Error updating playlist:", error.message);
        res.status(500).json({ "message": error.message });
    });
});

// Delete Playlist
router.delete('/playlists/:playlistId', authenticationCheck, async function(req, res) {
    let userId = res.locals.userId;
    let playlistId = req.params.playlistId;
    
    playlistService.deletePlaylist(playlistId, userId)
    .then(function(response) {
        res.status(200).json({ "message": response });
    })
    .catch(function(error) {
        console.error("Error deleting playlist:", error.message);
        res.status(500).json({ "message": error.message });
    });
});

// Add track to playlist
router.post('/playlists/:playlistId/tracks', authenticationCheck, async function(req, res) {
    let userId = res.locals.userId;
    let playlistId = req.params.playlistId;
    let track = req.body; // Should contain track data
    
    playlistService.addToPlaylist(playlistId, userId, track)
    .then(function(response) {
        res.status(200).json({ "message": response });
    })
    .catch(function(error) {
        console.error("Error adding track to playlist:", error.message);
        res.status(500).json({ "message": error.message });
    });
});

// Remove track from playlist
router.delete('/playlists/:playlistId/tracks/:spotifyTrackId', authenticationCheck, async function(req, res) {
    let userId = res.locals.userId;
    let playlistId = req.params.playlistId;
    let spotifyTrackId = req.params.spotifyTrackId;
    
    playlistService.removeFromPlaylist(playlistId, userId, spotifyTrackId)
    .then(function(response) {
        res.status(200).json({ "message": response });
    })
    .catch(function(error) {
        console.error("Error removing track from playlist:", error.message);
        res.status(500).json({ "message": error.message });
    });
});

// Liked Songs stuff ===============================================================================================================

module.exports = router;