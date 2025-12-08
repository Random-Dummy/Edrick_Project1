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
    // User CRUD
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
    async getAllSongs() {
        try {
            return await songs.find({});
        } catch (e) {
            throw new Error("Error retrieving songs");
        }
    },
    async getSong(id) {
        try {
            return await songs.findById(id);
        } catch (e) {
            throw new Error("Error retrieving song");
        }
    },

    async updateSong(id, data) {
        try {
            await songs.findByIdAndUpdate(id, data);
            return "Song updated successfully";
        } catch (e) {
            throw new Error("Error updating song");
        }
    },

    async deleteSong(id) {
        try {
            await songs.findByIdAndDelete(id);
            return "Song deleted successfully";
        } catch (e) {
            throw new Error("Error deleting song");
        }
    },

    async searchSongs(query) {
        try {
            let regex = new RegExp(query, "i");

            return await songs.find({
                $or: [
                    { title: regex },
                    { artist: regex },
                    { album: regex }
                ]
            });
        } catch (e) {
            throw new Error("Error performing search");
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
    async getLyrics(songId) {
        try {
            return await lyric.findOne({ song: songId }).populate("song");
        } catch (e) {
            throw new Error("Error retrieving lyrics");
        }
    },

    async updateLyrics(id, lyricsText) {
        try {
            await lyric.findByIdAndUpdate(id, { lyrics: lyricsText });
            return "Lyrics updated successfully";
        } catch (e) {
            throw new Error("Error updating lyrics");
        }
    },

    async deleteLyrics(id) {
        try {
            await lyric.findByIdAndDelete(id);
            return "Lyrics deleted successfully";
        } catch (e) {
            throw new Error("Error deleting lyrics");
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
    // Get Single Playlist
    async getPlaylist(id) {
        try {
            return await playlist.findById(id).populate("tracks");
        } catch (e) {
            console.log(e.message);
            throw new Error("Error retrieving playlist");
        }
    },

    // Update Playlist (only creator)
    async updatePlaylist(id, userId, data) {
        try {
            let pl = await playlist.findById(id);
            if (!pl) throw new Error("Playlist not found");

            // Permission check
            if (pl.creator.toString() !== userId.toString()) {
                throw new Error("Unauthorized: You are not the creator of this playlist");
            }

            await playlist.findByIdAndUpdate(id, data);
            return "Playlist updated successfully";
        } catch (e) {
            console.log(e.message);
            throw new Error(e.message);
        }
    },

    // Delete Playlist (only creator)
    async deletePlaylist(id, userId) {
        try {
            let pl = await playlist.findById(id);
            if (!pl) throw new Error("Playlist not found");

            // Permission check
            if (pl.creator.toString() !== userId.toString()) {
                throw new Error("Unauthorized: You are not the creator of this playlist");
            }

            await playlist.findByIdAndDelete(id);
            return "Playlist deleted successfully";
        } catch (e) {
            console.log(e.message);
            throw new Error(e.message);
        }
    },
    // Add song to playlist
    async addTrackToPlaylist(id, userId, songId) {
        try {
            let pl = await playlist.findById(id);
            if (!pl) throw new Error("Playlist not found");

            if (pl.creator.toString() !== userId.toString())
                throw new Error("Unauthorized: only creator can edit playlist");

            if (!pl.tracks.includes(songId)) {
                pl.tracks.push(songId);
                await pl.save();
            }

            return "Track added to playlist";
        } catch (e) {
            throw new Error(e.message);
        }
    },
    // Remove song from playlist
    async removeTrackFromPlaylist(id, userId, songId) {
        try {
            let pl = await playlist.findById(id);
            if (!pl) throw new Error("Playlist not found");

            if (pl.creator.toString() !== userId.toString())
                throw new Error("Unauthorized: only creator can edit playlist");

            pl.tracks = pl.tracks.filter(t => t.toString() !== songId);
            await pl.save();

            return "Track removed from playlist";
        } catch (e) {
            throw new Error(e.message);
        }
    },
}

module.exports = db;