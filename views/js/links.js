const BASE_URL = 'http://localhost:3000';
// Authentication
const LOGIN_URL = `${BASE_URL}/user/login`;
const LOGOUT_URL = `${BASE_URL}/user/logout`;
const REGISTER_URL = `${BASE_URL}/user/register`;

// Spotify
const SEARCH_URL = `${BASE_URL}/spotify/search`;
const TRACKS_URL = `${BASE_URL}/spotify/track`;

// Playlists
const PLAYLISTS_URL = `${BASE_URL}/playlists`;

// Liked Songs
const LIKED_SONGS_URL = `${BASE_URL}/liked-songs`;

// Users
const USERS_URL = `${BASE_URL}/user`;

// Logged into spotify account
const SPOTIFY_LOGGED_IN = `${BASE_URL}/spotify`;
const CALLBACK = `${BASE_URL}/spotify/api/callback`;