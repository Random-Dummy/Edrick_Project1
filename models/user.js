const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: String,
    email: { type: String, required: true, unique: true },
    
})