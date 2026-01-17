const express = require('express');
const router = express.Router();
const db = require("./service.js");
const crypto = require('crypto');

function authenticationCheck(req, res, next) {
    let token = req.query.token;
    if (!token) {
        res.status(401).json({ "message": "No tokens are provided." });
    } else {
        db.checkToken(token)
            .then(function (response) {
                if (response) {
                    res.locals.userID = response._id;
                    next();
                } else {
                    res.status(401).json({ "message": "Invalid token provided." });
                }
            })
            .catch(function (error) {
                res.status(500).json({ "message": error.message });
            });
    }
}

router.post('/api/user/login', function (req, res) {
    let data = req.body;
    db.getUser(data.username, data.password)
        .then(function (response) {
            if (!response) {
                res.status(401).json({ "message": "Login unsuccessful. Please try again later." });
            }
            else {
                let strToHash = response.username + Date.now();
                let token = crypto.createHash('md5').update(strToHash).digest('hex');
                db.updateToken(response._id, token)
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

router.get('/api/user/logout', authenticationCheck, function (req, res) {
    //retrieve the id that was stored earlier in the middleware.
    let id = res.locals.userID;
    db.removeToken(id)
        .then(function (response) {
            res.status(200).json({ 'message': 'Logout successful' });
        })
        .catch(function (error) {
            res.status(500).json({ "message": error.message });
        })
})

router.post('/api/user/register', function (req, res) {
    let data = req.body;
    db.addUser(data.username, data.email, data.password)
        .then(function (response) {
            res.status(200).json({ "message": response });
        })
        .catch(function (error) {
            res.status(500).json({ "message": error.message });
        });
})