const mongoose = require("mongoose");

let db = {
    async connect() {
        try {
            await mongoose.connect('mongodb://localhost:27017/Gobletto');
            return "Connected to Gobletto";
        } catch (e) {
            console.log(e);
            throw new Error("Could not connect to Gobletto");
        }
    }
}

module.exports = db;