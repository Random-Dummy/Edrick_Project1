const mongoose = require("mongoose");
const user = require("../models/user.js");
const likedSongs = require("../models/likedsong.js");
const playlists = require("../models/playlist.js");
const lyrics = require("../models/lyrics.js");

let db = {
    async connect() {
        try {
            await mongoose.connect('mongodb://localhost:27017/Gobletto');
            return "Connected to Gobletto";
        } catch (e) {
            console.log(e);
            throw new Error("Could not connect to Gobletto");
        }
    }
}

module.exports = db;