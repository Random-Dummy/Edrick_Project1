const mongoose = require('mongoose');
const playlist = require('../models/playlist.js');
const user = require('../models/user.js');

let playlistService = {
    async createPlaylist(name, creator, description, track) {
        try {
            // Ensure tracks are properly formatted
            const formattedTracks = track ? [{
                spotifyTrackId: track.spotifyTrackId,
                name: track.name,
                artist: track.artist,
                album: track.album || '',
                durationMs: track.durationMs || 0,
                albumImage: track.albumImage || ''
            }] : [];

            await playlist.create({
                name,
                creator,
                description,
                tracks: formattedTracks
            });
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

    async getPlaylistById(playlistId, userId) {
        try {
            const findPlaylist = await playlist.findOne({ _id: playlistId, creator: userId });
            if (!findPlaylist) { throw new Error("Playlist not found or no permission to access it"); }
            return findPlaylist;
        } catch (error) {
            console.error("Error retrieving playlist:", error.message);
            throw new Error(`Failed to retrieve playlist | ${error.message}`);
        }
    },

    async addToPlaylist(playlistId, userId, track) {
        try {
            const findPlaylist = await playlist.findOne({ _id: playlistId, creator: userId });
            if (!findPlaylist) throw new Error("Playlist not found");

            // Debug log to see what track data we're receiving
            console.log("Received track data:", track);

            // Extract the correct ID field
            const spotifyTrackId = track.spotifyTrackId || track.id || track.spotify_track_id;

            if (!spotifyTrackId) {
                throw new Error("Missing Spotify track ID");
            }

            const trackExist = findPlaylist.tracks.some(t => {
                // Check both possible ID fields
                return (t.spotifyTrackId === spotifyTrackId) || (t.id === spotifyTrackId);
            });

            if (trackExist) throw new Error("Track already exists in playlist");

            // Create properly formatted track object
            const formattedTrack = {
                spotifyTrackId: spotifyTrackId,
                name: track.name || 'Unknown Track',
                artist: track.artist || 'Unknown Artist',
                album: track.album || track.albumName || '',
                durationMs: track.durationMs || track.duration || 0,
                albumImage: track.albumImage || track.image || track.album_image || ''
            };

            // Log the formatted track for debugging
            console.log("Formatted track for playlist:", formattedTrack);

            findPlaylist.tracks.push(formattedTrack);
            await findPlaylist.save();

            return `Track ${formattedTrack.name} added successfully`;
        } catch (error) {
            console.error("Error adding track:", error.message);
            throw new Error(error.message);
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

    async togglePublicStatus(playlistId, userId, isPublic) {
        try {
            const findPlaylist = await playlist.findOne({ _id: playlistId, creator: userId });
            if (!findPlaylist) {
                throw new Error("Playlist not found or no permission to access it");
            }

            findPlaylist.isPublic = isPublic;
            await findPlaylist.save();

            return {
                success: true,
                message: `Playlist is now ${isPublic ? 'public' : 'private'}`,
                isPublic: findPlaylist.isPublic
            };
        } catch (error) {
            console.error("Error toggling playlist public status:", error.message);
            throw new Error(`Failed to update playlist visibility | ${error.message}`);
        }
    },

    async getPublicPlaylists(page = 1, limit = 20, search = '', sort = 'newest') {
        try {
            const skip = (page - 1) * limit;

            // Build query
            let query = { isPublic: true };

            // Add search functionality
            if (search && search.trim() !== '') {
                const searchRegex = new RegExp(search, 'i');
                query.$or = [
                    { name: searchRegex },
                    { description: searchRegex },
                    { 'creator.username': searchRegex }
                ];
            }

            // Build sort options
            let sortOption = {};
            switch (sort) {
                case 'popular':
                    // Sort by view count or clone count
                    sortOption = { cloneCount: -1, viewCount: -1 };
                    break;
                case 'cloned':
                    sortOption = { cloneCount: -1 };
                    break;
                case 'newest':
                default:
                    sortOption = { createdAt: -1 };
                    break;
            }

            const publicPlaylists = await playlist.find(query)
                .populate('creator', 'username email')
                .sort(sortOption)
                .skip(skip)
                .limit(limit);

            const total = await playlist.countDocuments(query);

            return {
                success: true,
                playlists: publicPlaylists,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error("Error getting public playlists:", error.message);
            throw new Error(`Failed to get public playlists | ${error.message}`);
        }
    },

    async clonePlaylist(playlistId, userId, newName = null) {
        try {
            const originalPlaylist = await playlist.findById(playlistId);
            if (!originalPlaylist) {
                throw new Error("Playlist not found");
            }

            if (!originalPlaylist.isPublic) {
                throw new Error("Cannot clone private playlist");
            }

            // Create new playlist name
            const playlistName = newName || `${originalPlaylist.name} (Copy)`;

            // Create the cloned playlist
            const clonedPlaylist = new playlist({
                name: playlistName,
                creator: userId,
                description: originalPlaylist.description,
                tracks: originalPlaylist.tracks,
                isPublic: false, // Cloned playlists are private by default
                originalPlaylistId: originalPlaylist._id
            });

            await clonedPlaylist.save();

            // Increment clone count on original
            originalPlaylist.cloneCount = (originalPlaylist.cloneCount || 0) + 1;
            await originalPlaylist.save();

            return {
                success: true,
                message: "Playlist cloned successfully",
                playlist: clonedPlaylist
            };
        } catch (error) {
            console.error("Error cloning playlist:", error.message);
            throw new Error(`Failed to clone playlist | ${error.message}`);
        }
    },

    async getUserPublicPlaylists(userId) {
        try {
            const userPlaylists = await playlist.find({
                creator: userId,
                isPublic: true
            });

            return {
                success: true,
                playlists: userPlaylists,
                count: userPlaylists.length
            };
        } catch (error) {
            console.error("Error getting user's public playlists:", error.message);
            throw new Error(`Failed to get user's public playlists | ${error.message}`);
        }
    },

    // Get public playlist by ID (no authentication required)
    async getPublicPlaylistById(playlistId) {
        try {
            const findPlaylist = await playlist.findById(playlistId)
                .populate('creator', 'username email');

            if (!findPlaylist) {
                throw new Error("Playlist not found");
            }

            if (!findPlaylist.isPublic) {
                throw new Error("This playlist is private");
            }

            // Increment view count (optional)
            findPlaylist.viewCount = (findPlaylist.viewCount || 0) + 1;
            await findPlaylist.save();

            return findPlaylist;
        } catch (error) {
            console.error("Error retrieving public playlist:", error.message);
            throw new Error(`Failed to retrieve playlist | ${error.message}`);
        }
    },
}

module.exports = playlistService;