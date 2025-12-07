const mongoose = require('mongoose');
const Songs = require('./song.js');
const Playlists = require('./playlist.js');
const Lyrics = require('./lyric.js');
const Users = require('./user.js');

let db = {
    async connect() {
        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/eventManagementDB');
            return "Connected to Mongo DB";
        }
        catch(e) {
            console.log(e.message);
            throw new Error("Error connecting to Mongo DB");
        }
    },
}

module.exports = db;