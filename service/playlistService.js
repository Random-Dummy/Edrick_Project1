const mongoose = require('mongoose');
const playlist = require('../models/playlist.js');
const user = require('../models/user.js');

const playlistService = {
    async createPlaylist(name, description, creatorId, picture) {
        try {
            await playlist.create({
                name: name,
                description: description,
                creator: creatorId,
                picture: picture
            });
            return (`Playlist '${name}' created successfully.`);
        } catch (e) {
            console.log(e.message);
            throw new Error(`Error creating playlist ${name}: ${e.message}`);
        }
    },

    async getPlaylist(id) {
        try {
            let playlist = await playlist.findById(id);
            return playlist;
        } catch (e) {
            console.log(e.message);
            throw new Error(`Error getting playlist ${id}: ${e.message}`);
        }
    },

    async deletePlaylist(playlistId, userId) {
        try {
            let deletedPlaylist = await playlist.findOneAndDelete({ _id: playlistId, creator: userId });
            if (!deletedPlaylist) {
                throw new Error("Playlist not found or user unauthorized.");
            }
            return (`Playlist with id ${playlistId} deleted successfully.`);
        } catch (e) {
            console.log(e.message);
            throw new Error(`Error deleting playlist ${playlistId}: ${e.message}`);
        }
    },

    async updatePlaylist(playlistId, userId, data) {
        try {
            let 
            } catch (e) {
                throw new Error(`Error updating playlist ${playlistId}: ${e.message}`);
            }
        },

    async addToPlaylist(playlistId, userId, song) {
        try {
            let foundPlaylist = await playlist.findOne({ _id: playlistId, creator: userId });
            if (!foundPlaylist) {
                throw new Error("Playlist not found or user unauthorized.");
            }
            let songExist = foundPlaylist.tracks.some(track => track.spotifyTrackId === song.spotifyTrackId);
            if (songExist) {
                throw new Error("Song already exists in the playlist.");
            }
            foundPlaylist.tracks.push(song);
            await foundPlaylist.save();
            return "Song added to playlist successfully.";
        } catch (e) {
            console.log(e.message);
            throw new Error(`Error adding song to playlist ${playlistId}: ${e.message}`);
        }
    },

    async removeFromPlaylist(playlistId, userId, songId) {
        try {
            let foundPlaylist = await playlist.findOne({ _id: playlistId, creator: userId });
            if (!foundPlaylist) {
                throw new Error("Playlist not found or user unauthorized.");
            }
            let songIndex = foundPlaylist.tracks.findIndex(track => track.spotifyTrackId === songId);
            if (songIndex === -1) {
                throw new Error("Song not found in the playlist.");
            }
            const removedSong = foundPlaylist.tracks.splice(songIndex, 1)[0];
            await foundPlaylist.save();
            return `Removed song: ${removedSong.name}`;
        } catch (e) {
            console.log(e.message);
            throw new Error(`Error removing song from playlist ${playlistId}: ${e.message}`);
        }
    },


}