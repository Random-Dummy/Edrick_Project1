const mongoose = require('mongoose');
const likedSongs = require('../models/likedsong.js');
const spotifyService = require('./spotifyService.js');
const lyricService = require('./lyricService.js');

let likedsongservice = {
    async addLikedSong(userId, spotifyTrackId) {
        try {
            const trackDetails = await spotifyService.getTrackDetails(spotifyTrackId);
            if (!trackDetails) {
                return {
                    success: false,
                    message: 'Track not found on Spotify'
                };
            }
            // Find if user already has a liked songs document
            const userLikedSongs = await likedSongs.findOne({ user: userId });
            if (!userLikedSongs) {
                await likedSongs.create({
                    user: userId,
                    tracks: [trackDetails]
                });
                return {
                    success: true,
                    message: 'Track added to liked songs',
                    track: trackDetails
                };
            } else {
                // Check if track is already in the liked songs
                const trackExists = userLikedSongs.tracks.some(function (track) {
                    return track.spotifyTrackId === spotifyTrackId;
                });
                if (trackExists) {
                    return {
                        success: false,
                        message: `Track ${trackDetails.name} by ${trackDetails.artist} is already in liked songs`
                    };
                }
                userLikedSongs.tracks.push(trackDetails);
                await userLikedSongs.save();
                return {
                    success: true,
                    message: `Track: ${trackDetails.name} by ${trackDetails.artist} added to liked songs`,
                    track: trackDetails
                };
            }
        } catch (error) {
            console.error('Error adding liked song:', error);
            return {
                success: false,
                message: 'Failed to add track to liked songs',
                error: error.message
            };
        }
    },

    async removeLikedSong(userId, spotifyTrackId) {
        try {
            // Find if user has a liked songs document
            const userLikedSongs = await likedSongs.findOne({ user: userId });
            if (!userLikedSongs) {
                return {
                    success: false,
                    message: 'User has no liked songs'
                };
            }
            // Check if track is already in the liked songs
            const trackIndex = userLikedSongs.tracks.findIndex(function (track) {
                return track.spotifyTrackId === spotifyTrackId;
            });
            if (trackIndex === -1) {
                return {
                    success: false,
                    message: 'Track not found in liked songs'
                };
            }
            // Store the track details & remove
            const removedTrack = userLikedSongs.tracks[trackIndex];
            userLikedSongs.tracks.splice(trackIndex, 1);
            // If no tracks left, delete the entire document
            if (userLikedSongs.tracks.length === 0) {
                await likedSongs.deleteOne({ _id: userLikedSongs._id });
            } else {
                await userLikedSongs.save();
            }
            return {
                success: true,
                message: 'Track removed from liked songs',
                track: removedTrack
            };
        } catch (error) {
            console.error('Error removing liked song:', error);
            return {
                success: false,
                message: 'Failed to remove track from liked songs',
                error: error.message
            };
        }
    },

    // Lyrics
    async getLikedSongsWithLyrics(userId) {
        try {
            const userLikedSongs = await likedSongs.findOne({ user: userId });
            if (!userLikedSongs || !userLikedSongs.tracks.length) {
                return {
                    success: false,
                    message: 'No liked songs found'
                };
            }
            const tracksWithLyrics = [];
            for (const track of userLikedSongs.tracks.slice(0, 10)) {
                const lyricsResult = await lyricService.getLyrics(
                    track.spotifyTrackId,
                    track.name,
                    track.artist
                );
                tracksWithLyrics.push({
                    ...track,
                    hasLyrics: lyricsResult.success,
                    lyricsPreview: lyricsResult.success
                        ? lyricsResult.lyrics.substring(0, 100) + '...'
                        : null
                });
            }
            return {
                success: true,
                totalTracks: userLikedSongs.tracks.length,
                tracks: tracksWithLyrics
            };
        } catch (error) {
            console.error('Error getting liked songs with lyrics:', error);
            return {
                success: false,
                message: 'Failed to get liked songs with lyrics',
                error: error.message
            };
        }
    }
};

module.exports = likedsongservice;