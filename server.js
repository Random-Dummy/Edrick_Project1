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

// const IP_ADDRESS = '127.0.0.1';
// https.createServer(sslOptions, app).listen(port, IP_ADDRESS, function () {
//     console.log('--- Secure Server Status ---');
//     console.log(`Server is successfully running on HTTPS`);
//     console.log(`Listening at: https://${IP_ADDRESS}:${port}`);
//     console.log('----------------------------');
// });
