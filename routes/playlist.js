const express = require('express');
const router = express.Router();
const db = require("./service.js");
const crypto = require('crypto');

router.get