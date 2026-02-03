const mongoose = require("mongoose");
const user = require("./user.js");

let userService = {
    async createUser(username, email, password) {
        try {
            const existUser = await user.findOne({ email: email });
            if (existUser) {
                throw new Error("User with this email already exists");
            }
            const newUser = new user({ username, email, password });
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
};

module.exports = userService;