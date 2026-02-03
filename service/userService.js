const mongoose = require("mongoose");
const user = require("../models/user.js");

let userService = {
    async createUser(username, email, password) {
        try {
            const existUser = await user.findOne({ email: email });
            if (existUser) {
                throw new Error("User with this email already exists");
            }
            const newUser = new user({ username, email, password });
            await newUser.save();
            return newUser;
        } catch (error) {
            console.error("Error creating user:", error.message);
            throw new Error("Failed to create user");
        }
    },

    async deleteUser(userId) {
        try {
            const deletedUser = await user.findByIdAndDelete(userId);
            if (!deletedUser) {
                throw new Error("User not found");
            }
            return "User deleted successfully";
        } catch (error) {
            console.error("Error deleting user:", error.message);
            throw new Error("Failed to delete user");
        }
    },

    async getUserbyId(userId) {
        try {
            const findUser = await user.findById(userId);
            if (!findUser) { throw new Error("User not found"); }
            return findUser;
        } catch (error) {
            console.error("Error finding user:", error.message);
            throw new Error("Failed to find user");
        }
    },

    async userLogin(email, password) {
        try {
            let result = await user.findOne({ email: email, password: password });
            return result;
        } catch (error) {
            console.error("Error in user login:", error.message);
            throw new Error("Login failed");
        }
    },

    async updateToken(userId, token) {
        try {
            await user.findByIdAndUpdate(userId, {
                token: token
            });
            return;
        } catch (e) {
            console.error(e.message);
            throw new Error("Error updating user token, please try again later.");
        }
    },


    async checkToken(token) {
        try {
            let result = await user.findOne({
                token: token
            });
            return result;
        } catch (e) {
            console.error(e.message);
            throw new Error("Error checking token, please try again later.");
        }
    },


    async removeToken(userId) {
        try {
            const result = await user.findByIdAndUpdate(userId, {
                $unset: {
                    token: 1,
                    spotifyRefreshtoken: 1
                }
            });
            if (!result) {
                throw new Error("User not found to remove token.");
            }
            return;
        } catch (e) {
            console.error(e.message);
            throw new Error("Error removing token, please try again later.");
        }
    },
};

module.exports = userService;