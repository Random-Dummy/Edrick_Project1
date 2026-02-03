const express = require('express');
const app = express();
const port = 3000;
const routes = require('./routes.js');
require('dotenv').config({path: 'config.env'});

app.use('/',routes);
app.use(express.static('views'));
app.listen(port, function () {
    console.log('Server started on port ' + port);
    console.log('Spotify Client ID:', process.env.SPOTIFY_CLIENT_ID ? 'Loaded' : 'Missing');
    console.log('Genius Token:', process.env.GENIUS_ACCESS_TOKEN ? 'Loaded' : 'Missing');
});