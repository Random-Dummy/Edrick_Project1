const mongoose = require('mongoose');
const playlist = require('../models/playlist.js');
const user = require('../models/user.js');

let playlistService = {
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

    
}