# WAD Project
Name: Edrick <br>
Module Group: L1 <br>

## Project Title
**Goblettos** - A Web Application that downloads your favourite songs and provides lyrics for them with Spotify inegration.
<br> 
## Background
Why do you want to build this web application? <br>

---

## Key Features
Write down clearly what are the things the user can perform with your web application.<br>

- **User Registration**
- **User Login**
- **User Logout**
- **CRUD Operations for Tracks (Products)**
  - Create a track entry  
  - Retrieve stored tracks  
  - Update a track  
  - Delete a track  
- **Search Tracks (using Spotify API)**
- **Fetch Lyrics (Genius Lyrics API via RapidAPI)**
- **User Favourite Songs Playlist**
  - Add song to favourites  
  - Remove from favourites  
  - View favourites  
- View artist details  
- Auto-store song metadata from Spotify into DB

---

## External API(s) that you would like to use
Describe which external APIs that you would like to use and how you would use them. Put the reference links where you found the APIs.

### **1. Spotify Web API**
- Search songs, albums, and artists  
- Fetch track details including duration, popularity, preview URL, etc.  
- Retrieve artist details and metadata

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
