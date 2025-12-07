const mongoose = require('mongoose');
const songs = require('./models/song.js');
const playlist = require('./models/playlist.js');
const lyric = require('./models/lyric.js');
const user = require('./models/user.js');

let db = {
    async connect() {
        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/Projekt1');
            return "Connected to Mongo DB";
        }
        catch (e) {
            console.log(e.message);
            throw new Error("Error connecting to Mongo DB");
        }
    },
    async updateToken(id, token) {
        try {
            await user.findByIdAndUpdate(id, { token: token });
            return;
        }
        catch (e) {
            console.log(e.message);
            throw new Error("Error at the server. Please try again later.");
        }
    },
    async checkToken(token) {
        try {
            let result = await user.findOne({ token: token });
            return result;
        }
        catch (e) {
            console.log(e.message);
            throw new Error("Error at the server. Please try again later.");
        }
    },
    async removeToken(id) {
        try {
            await user.findByIdAndUpdate(id, { $unset: { token: 1 } });
            return;
        }
        catch (e) {
            console.log(e.message);
            throw new Error("Error at the server. Please try again later.");
        }
    },
    async getUser(username, password) {
        try {
            let result = await user.findOne({ username: username, password: password });
            return result;
        } catch (e) {
            console.log(e.message);
            throw new Error("Error at the server. Please try again later.");
        }
    },

    // Song CRUD
    async addSong(title, artist, album, previewUrl, duration) {
        try {
            await songs.create({
                title: title,
                artist: artist,
                album: album,
                previewUrl: previewUrl,
                duration: duration
            });
            return "Song added successfully";
        } catch (e) {
            console.log(e.message);
            throw new Error("Error adding song");
        }
    },
    // Playlist CRUD
    async addPlaylist(name, description, tracks, creator) {
        try {
            await playlist.create({
                name: name,
                description: description,
                tracks: tracks,
                creator: creator
            });
            return "Playlist added successfully";
        } catch (e) {
            console.log(e.message);
            throw new Error("Error adding playlist");
        }
    },
    // Lyric CRUD
    async addLyrics(songId, lyrics) {
        try {
            await lyric.create({
                song: songId,
                lyrics: lyrics
            });
            return "Lyrics added successfully";
        } catch (e) {
            console.log(e.message);
            throw new Error("Error adding lyrics");
        }
    },
    // User CRUD
    async addUser(username, email, password) {
        try {
            await user.create({
                username: username,
                email: email,
                password: password,
                token: null
            });
            return "User added successfully";
        } catch (e) {
            console.log(e.message);
            throw new Error("Error adding user");
        }
    },
}

module.exports = db;