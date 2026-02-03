require('dotenv').config();
const express = require('express');
const https = require('https');
const app = express();
const port = 3000;
const routes = require('./routes.js');
const IP_ADDRESS = '127.0.0.64';

app.use('/', routes);
app.use(express.static('views'));