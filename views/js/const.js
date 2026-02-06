const BASE_URL = 'https://127.0.0.1:3000';
// Authentication
const LOGIN_URL = `${BASE_URL}/user/login`;
const LOGOUT_URL = `${BASE_URL}/user/logout`;
const REGISTER_URL = `${BASE_URL}/user/register`;

// Spotify
const SEARCH_URL = `${BASE_URL}/spotify/search`;
const TRACKS_URL = `${BASE_URL}/spotify/track`;

// Playlists
const PLAYLISTS_URL = `${BASE_URL}/api/playlists`;

// Liked Songs
const LIKED_SONGS_URL = `${BASE_URL}/api/liked-songs`;

// Users
const USERS_URL = `${BASE_URL}/api/users`;

// Logged into spotify account
const SPOTIFY_LOGGED_IN = `${BASE_URL}/api/spotify`;
const CALLBACK = `${BASE_URL}/spotify/api/callback`;