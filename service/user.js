const mongoose = require('mongoose');
const user = require('../models/user.js');

let userService = {
    async createUser(username, email, password) {
        try {
            let existingUser = await user.findOne({ email: email });
            if (existingUser) {
                throw new Error("Email already in use.");
            }
            let newUser = await user.create({
                username: username,
                email: email,
                password: password
            });
            return newUser;
        } catch (e) {
            console.error(e.message);
            throw new Error(`Error creating user. ${e.message}`);
        }
    },

    async getUserById(id) {
        try {
            let user = await user.findById(id);
            if (!user) {
                throw new Error("User not found.");
            }
            return user;
        } catch (e) {
            console.error(e.message);
            throw new Error(`Error getting user. ${id}`);
        }
    },

    async updateUser(id, updateData) {
        try {
            let updatedUser = await user.findByIdAndUpdate(id, updateData, { new: true });
            if(!updatedUser) {
                throw new Error("User not found.");
            }
            return updatedUser;
        } catch (e) {
            console.error(e.message);
            throw new Error(`Error updating user. ${id}`);
        }
    },

    async deleteUser(id) {
        try {
            let deletedUser = await user.findByIdAndDelete(id);
            if(!deletedUser) {
                throw new Error("User not found.");
            }
            return { message: "User deleted successfully.", deletedUser: id };
        } catch (e) {
            console.error(e.message);
            throw new Error(`Error deleting user. ${id}`);
        }
    },

    async userLogin(email, password) {
        try {
            let result = await user.findOne({ email: email, password: password });
            if (!result) {
                throw new Error("Invalid email or password.");
            }
            return result;
        } catch (e) {
            console.error(e.message);
            throw new Error(`Error logging in user. ${e.message}`);
        }
    },

    async updateToken(id,token) {
        try {
            await user.findByIdAndUpdate(id,{$set:{token}});
            return;
        }
        catch(e) {
            console.log(e.message);
            throw new Error("Error at the server. Please try again later.");
        }
    },
    async checkToken(token) {
        try {
            let result = await user.findOne({token:token});
            return result;
        }
        catch(e) {
            console.log(e.message);
            throw new Error("Error at the server. Please try again later.");
        }
    },
    async removeToken(id) {
        try {
            await user.findByIdAndUpdate(id, {$unset: {token: ""}});
            return;
        }
        catch(e) {
            console.log(e.message);
            throw new Error("Error at the server. Please try again later.");
        }
    }
};

module.exports = userService;