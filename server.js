const express = require('express');
const cors = require('cors');  // <-- import cors
const app = express();
const port = 3000;
const routes = require('./routes.js');
require('dotenv').config({ path: 'config.env' });

app.use(cors());  // <-- use cors

// Middleware to parse JSON bodies
app.use(express.json());

// Use your routes
app.use('/', routes);

// Serve static files
app.use(express.static('views'));

// Start server
app.listen(port, function () {
    console.log('Server started on port ' + port);
    console.log('Spotify Client ID:', process.env.SPOTIFY_CLIENT_ID ? 'Loaded' : 'Missing');
    console.log('Genius Token:', process.env.GENIUS_ACCESS_TOKEN ? 'Loaded' : 'Missing');
});