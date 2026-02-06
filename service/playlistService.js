const mongoose = require('mongoose');
const playlist = require('../models/playlist.js');
const user = require('../models/user.js');

let playlistService = {
    async createPlaylist(name, creator, description, track) {
        try {
            await playlist.create({ name, creator, description, tracks: track });
            return "Playlist created successfully";
        } catch (error) {
            console.error("Error creating playlist:", error.message);
            throw new Error(`Failed to create playlist ${name} | ${error.message}`);
        }
    },

    async deletePlaylist(playlistId, userId) {
        try {
            // FIXED: Changed user to creator to match schema
            const deletedPlaylist = await playlist.findOneAndDelete({ _id: playlistId, creator: userId });
            if (!deletedPlaylist) {
                throw new Error("Playlist not found or no permission to access it");
            }
            return "Playlist deleted successfully";
        } catch (error) {
            console.error("Error deleting playlist:", error.message);
            throw new Error(`Failed to delete playlist | ${error.message}`);
        }
    },

    async updatePlaylist(playlistId, userId, data) {
        try {
            const findPlaylist = await playlist.findOne({ _id: playlistId, creator: userId });
            if (!findPlaylist) { throw new Error("Playlist not found or no permission to access it"); }
            let result = await playlist.findByIdAndUpdate(playlistId, data, { new: true });
            if (!result) { throw new Error("Update failed"); }
            return result;
        } catch (error) {
            console.error("Error updating playlist:", error.message);
            throw new Error(`Failed to update playlist | ${error.message}`);
        }
    },

    async getPlaylist(userId) {
        try {
            const playlists = await playlist.find({ creator: userId });
            return playlists;
        } catch (error) {
            console.error("Error retrieving playlists:", error.message);
            throw new Error(`Failed to retrieve playlists | ${error.message}`);
        }
    },

    async addToPlaylist(playlistId, userId, track) {
        try {
            const findPlaylist = await playlist.findOne({ _id: playlistId, creator: userId });
            if (!findPlaylist) { throw new Error("Playlist not found or no permission to access it"); }
            const trackExist = findPlaylist.tracks.some(t => t.spotifyTrackId === track.spotifyTrackId);
            if (trackExist) { throw new Error("Track already exists in the playlist"); }
            findPlaylist.tracks.push(track);
            await findPlaylist.save();
            return `Track ${track.name} added to playlist successfully`;
        } catch (error) {
            console.error("Error adding track to playlist:", error.message);
            throw new Error(`Failed to add track to playlist | ${error.message}`);
        }
    },

    async removeFromPlaylist(playlistId, userId, spotifyTrackId) {
        try {
            const findPlaylist = await playlist.findOne({ _id: playlistId, creator: userId });
            if (!findPlaylist) { throw new Error("Playlist not found or no permission to access it"); }
            const trackIndex = findPlaylist.tracks.findIndex(s => s.spotifyTrackId === spotifyTrackId);
            if (trackIndex === -1) { throw new Error("Track not found in the playlist"); }
            const removeTrack = findPlaylist.tracks.splice(trackIndex, 1)[0];
            await findPlaylist.save();
            return `Track ${removeTrack.name} removed from playlist successfully`;
        } catch (error) {
            console.error("Error removing track from playlist: ", error.message);
            throw new Error(`Failed to remove track from playlist | ${error.message}`);
        }
    },
}

module.exports = playlistService;