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

function authenticationCheck(req,res,next) {
    //check if query token is in the url
    let token = req.query.token;
    if(!token) {
        res.status(401).json({"message":"No tokens are provided."});
    } else {
        db.checkToken(token)
        .then(function(response){
            //Matched token in the db, proceed with the request
            if(response) {
                //response = organizer who is logged in.
                // store the organizer's id in local memory to be used in the route handler
                res.locals.organizerId = response._id;
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
    db.getOrganizer(data.username,data.password)
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

router.get('/api/user/logout',function(req,res){
    //retrieve the id that was stored earlier in the middleware.
    let id = res.locals.organizerId;
    db.removeToken(id)
    .then(function(response){
        res.status(200).json({'message':'Logout successful'});
    })
    .catch(function(error){
        res.status(500).json({"message":error.message});
    })
})

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

module.exports = router;