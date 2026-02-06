const mongoose = require("mongoose");
const user = require("../models/user.js");

let userService = {
    /* ============================
       User CRUD
    ============================ */
    async createUser(username, email, password) {
        try {
            const existUser = await user.findOne({ email });
            if (existUser) throw new Error("User with this email already exists");

            const newUser = new user({ username, email, password });
            await newUser.save();
            return newUser;
        } catch (error) {
            console.error("Error creating user:", error.message);
            throw new Error("Failed to create user");
        }
    },

    async updateUser(userId, data) {
        try {
            const updatedUser = await user.findByIdAndUpdate(userId, data, { new: true });
            if (!updatedUser) throw new Error("User not found");
            return updatedUser;
        } catch (error) {
            console.error("Error updating user:", error.message);
            throw new Error("Failed to update user");
        }
    },

    async deleteUser(userId) {
        try {
            const deletedUser = await user.findByIdAndDelete(userId);
            if (!deletedUser) throw new Error("User not found");
            return "User deleted successfully";
        } catch (error) {
            console.error("Error deleting user:", error.message);
            throw new Error("Failed to delete user");
        }
    },

    async getUserbyId(userId) {
        try {
            const findUser = await user.findById(userId);
            if (!findUser) throw new Error("User not found");
            return findUser;
        } catch (error) {
            console.error("Error finding user:", error.message);
            throw new Error("Failed to find user");
        }
    },

    /* ============================
       Auth
    ============================ */
    async userLogin(email, password) {
        try {
            const result = await user.findOne({ email, password });
            return result;
        } catch (error) {
            console.error("Error in user login:", error.message);
            throw new Error("Login failed");
        }
    },

    async updateToken(userId, token) {
        try {
            await user.findByIdAndUpdate(userId, { token });
        } catch (error) {
            console.error(error.message);
            throw new Error("Error updating user token, please try again later.");
        }
    },

    async checkToken(token) {
        try {
            const result = await user.findOne({ token });
            return result;
        } catch (error) {
            console.error(error.message);
            throw new Error("Error checking token, please try again later.");
        }
    },

    async removeToken(userId) {
        try {
            const result = await user.findByIdAndUpdate(userId, {
                $unset: {
                    token: 1,
                    spotifyAccessToken: 1,
                    spotifyRefreshToken: 1
                }
            });
            if (!result) throw new Error("User not found to remove token.");
        } catch (error) {
            console.error(error.message);
            throw new Error("Error removing token, please try again later.");
        }
    },

    /* ============================
       Spotify Integration
    ============================ */
    async saveSpotifyTokens(userId, accessToken, refreshToken) {
        try {
            await user.findByIdAndUpdate(userId, {
                spotifyAccessToken: accessToken,
                spotifyRefreshToken: refreshToken
            });
        } catch (error) {
            console.error("Error saving Spotify tokens:", error.message);
            throw new Error("Failed to save Spotify tokens");
        }
    },

    async getSpotifyRefreshToken(userId) {
        try {
            const u = await user.findById(userId);
            return u?.spotifyRefreshToken || null;
        } catch (error) {
            console.error("Error fetching Spotify refresh token:", error.message);
            throw new Error("Failed to get Spotify refresh token");
        }
    }
};

module.exports = userService;