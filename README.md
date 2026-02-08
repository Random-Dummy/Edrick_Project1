# WAD Project

## Project Title
**Goblettos** - A Web Application that downloads your favourite songs and provides lyrics for them with Spotify inegration.
<br> 
## Background
Why do you want to build this web application? <br>

Gobletto allows you to manage your music from spotify, giving you the ability to search for songs, view lyrics, and manage your playlists. It also allows you to save your favourite songs and view them later. It aims to be the application you use to help you manage your music collection, giving you easy & quick access to the music you need for your needs, whether it'd be for editing or a deep delve review into the lyrics.


## Set Up & Installation
To install & run this project, follow the steps below

1. Clone the repository
```bash 
git clone https://github.com/Random-Dummy/Edrick_Project1
cd Gobletto
```
2. Install dependencies, Run the command below to install all the dependencies the project uses
```bash 
npm install
```

3. Create a config.env file in the root directory of the project and add the following variables. Replace the values inside with your own API keys
```bash
SPOTIFY_CLIENT_ID=SPOTIFY_CLIENT
SPOTIFY_CLIENT_SECRET=SPOTIFY_CLIENT_SECRET
REDIRECT_URI=REDIRECT_URL

GENIUS_CLIENT_ID=GENIUS_CLIENT
GENIUS_CLIENT_SECRET=GENIUS_CLIENT_SECRET
GENIUS_ACCESS_TOKEN=GENIUS_ACCESS_TOKEN
```

4. Run the application
```bash 
node server.js
```

5. Access the application at http://localhost:3000
---

### Dependencies Used
This project uses the following Node.js Modules:

- **axios** (^1.13.2) - Promise-based HTTP client for making requests to external APIs
- **dotenv** (^17.2.3) - Loads environment variables from a .env file
- **express** (^5.1.0) - Fast, unopinionated, minimalist web framework for Node.js
- **init** (^0.1.2) - Utility for initializing projects
- **mongoose** (^9.0.0) - MongoDB object modeling tool designed to work in an asynchronous environment
- **nodemon** (^3.1.11) - Tool that helps develop Node.js based applications by automatically restarting the node application when file changes in the directory are detected
- **spotify-web-api-node** (^5.0.2) - Node.js wrapper for Spotify's Web API
- **cors** (^2.8.5) - Cross-origin resource sharing middleware
- **cheerio** (^1.0.0-rc.12) - HTML parsing/jQuery-like library

## Key Features
Write down clearly what are the things the user can perform with your web application.<br>

### Basic Features
- **User Registration**
- **User Login**
- **User Logout**
- **Search Songs** – Search tracks using Spotify API

### Advanced Features
- **User Playlist Management** - Control and manage your playlists via Spotify API
- **Auto-store Song Metadata** – Store Spotify track details automatically in the database.
  - Store Spotify song details automatically inside the database 
- **Lyrics Fetching** – Search and display song lyrics using Genius Lyrics API via RapidAPI.
---

## API Routes

## External API(s) that you would like to use
Describe which external APIs that you would like to use and how you would use them. Put the reference links where you found the APIs.

### **1. Spotify Web API**
- Search songs, albums, and artists  
- Fetch track details including duration, preview URL, etc.  

---

### **2. Genius Lyrics API**  
Used to:
- Search lyrics based on track or artist  
- Fetch detailed lyric information for any selected track  
- Enhance track detail pages with lyrics data  

## External Node Modules
Describe any node modules that you would like to use or have used in the current stage of the project.

### **1. spotify-web-api-node**
Used for:
- Authenticating with Spotify using client credentials  
- Searching music directly via built-in functions  
- Fetching track/artist/album metadata

### **2. axios**

Used for:
- Making GET requests to Genius Lyric APIs  
- Handling external API responses and errors  
- Simplifying API calls and responses

## References
Put all the reference links where you have used for your project<br>
https://developer.spotify.com/documentation/web-api <br>
https://rapidapi.com/Glavier/api/genius-song-lyrics1 <br>
https://github.com/thelinmichael/spotify-web-api-node <br>
https://axios-http.com/docs/intro <br>
<br>
:warning: This repository includes gitignore file which will not commit certain files or folders (especially node_modules folder) for a node.js project into the repository.  
**Please do not remove the .gitignore file as it will help to minimize the size of the project in the repository.** 
