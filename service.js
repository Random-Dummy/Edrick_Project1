const mongoose = require('mongoose');
const Songs = require('./models/song.js');
const Playlists = require('./models/playlist.js');
const Lyrics = require('./models/lyric.js');
const Users = require('./models/user.js');

let db = {
    async connect() {
        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/Projekt1');
            return "Connected to Mongo DB";
        }
        catch(e) {
            console.log(e.message);
            throw new Error("Error connecting to Mongo DB");
        }
    },
    async updateToken(id,token) {
        try {
            await organizer.findByIdAndUpdate(id,{token:token});
            return;
        }
        catch(e) {
            console.log(e.message);
            throw new Error("Error at the server. Please try again later.");
        }
    },
    async checkToken(token) {
        try {
            let result = await organizer.findOne({token:token});
            return result;
        }
        catch(e) {
            console.log(e.message);
            throw new Error("Error at the server. Please try again later.");
        }
    },
    async removeToken(id) {
        try {
            await organizer.findByIdAndUpdate(id, {$unset: {token: 1}});
            return;
        }
        catch(e) {
            console.log(e.message);
            throw new Error("Error at the server. Please try again later.");
        }
    },

    // add crud operations below
    async addSong(title, artist, album, previewUrl, duration) {
        try{
            await Songs.create({
                title: title,
                artist: artist, 
                album: album,
                previewUrl: previewUrl,
                duration: duration
            });
            return "Song added successfully";
        } catch(e) {
            console.log(e.message);
            throw new Error("Error adding song");
        }
    },
    async addPlaylist(name, description, tracks, creator) {
        try{
            await Playlists.create({
                name: name,
                description: description,
                tracks: tracks,
                creator: creator
            });
            return "Playlist added successfully";
        } catch(e) {
            console.log(e.message);
            throw new Error("Error adding playlist");
        }
    },
    async addLyrics(songId, lyrics) {
        try{
            await Lyrics.create({
                song: songId,
                lyrics: lyrics
            });
            return "Lyrics added successfully";
        } catch(e) {
            console.log(e.message);
            throw new Error("Error adding lyrics");
        }
    },
    async addUser(username, email, password) {
        try{
            await Users.create({
                username: username,
                email: email,
                password: password
            });
            return "User added successfully";
        } catch(e) {
            console.log(e.message);
            throw new Error("Error adding user");
        }
    },

}

module.exports = db;