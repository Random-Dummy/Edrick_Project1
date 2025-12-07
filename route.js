const express = require('express');
const router = express.Router();
const db = require("./service.js");
const crypto = require('crypto');

db.connect()
.then(function(response){
    console.log(response);
})
.catch(function(error){
    console.log(error.message);
});

router.use(express.urlencoded({
    extended: true
}));

 