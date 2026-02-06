const urlParams = new URLSearchParams(window.location.search);
const playlistId = urlParams.get('id');

let embedController = null;
let isPlaying = false;
let trackData = [];
let iFrameAPI = null;
let currentTrackId = null;

window.onSpotifyIframeApiReady = (IFrameAPI) => {
    iFrameAPI = IFrameAPI;
    if (trackData.length > 0 && !embedController) {
        initSpotifyPlayer(trackData[0].id);
    }
};

// Initialize UI components and Event Listeners
$(async function () {
    // Lyrics Sidebar Toggle Logic
    const lyricsBtn = $('#lyrics-toggle-btn');
    const lyricsCol = $('#lyrics-column');
    const playlistCol = $('#playlist-column');

    $('#playlist-container').on('click', '.song-row', function () {
        const trackId = $(this).attr('data-id');
        currentTrackId = trackId;

        if (embedController) {
            embedController.loadUri(`spotify:track:${trackId}`).then(() => {
                embedController.togglePlay();

                // Now update lyrics after track is loaded
                if (!lyricsCol.hasClass('d-none')) {
                    getLyrics(trackId);
                }
            }).catch(error => console.error("Error loading track:", error));
        } else {
            console.error("Player controller not initialized yet.");
        }
    });

    $('#playlist-container').on('click', '.delete-track-btn', function (e) {
        e.stopPropagation();
        const trackId = $(this).attr('data-id');
        deleteTrack(trackId);
    });

    // Lyrics toggle button
    lyricsBtn.on('click', function () {
        lyricsCol.toggleClass('d-none');

        if (!lyricsCol.hasClass('d-none')) {
            lyricsBtn.removeClass('text-secondary').addClass('text-success');
            playlistCol.removeClass('mx-auto');

            // Always fetch lyrics for current track
            if (currentTrackId) {
                getLyrics(currentTrackId);
            } else if (trackData.length > 0) {
                getLyrics(trackData[0].id);
            }
        } else {
            lyricsBtn.addClass('text-secondary').removeClass('text-success');
            playlistCol.addClass('mx-auto');
        }
    });

    const searchBar = $('#search-bar');
    searchBar.on('input', function () {
        const searchTerm = $(this).val().toLowerCase().trim();
        if (searchTerm === '') {
            renderFullPlaylist();
            return;
        }

        const scoredTracks = trackData.map(track => {
            const trackName = track.name.toLowerCase();
            const artist = track.artist.toLowerCase();
            const album = track.album.toLowerCase();

            let score = 0;
            if (trackName.startsWith(searchTerm)) score += 100;
            else if (artist.startsWith(searchTerm)) score += 80;
            else if (album.startsWith(searchTerm)) score += 60;
            else if (trackName.includes(searchTerm)) score += 40;
            else if (artist.includes(searchTerm)) score += 20;
            else if (album.includes(searchTerm)) score += 10;
            return { ...track, score };
        }).filter(track => track.score > 0)
            .sort((a, b) => b.score - a.score);

        const filteredTracks = scoredTracks.map(({ score, ...track }) => track);
        renderPlaylist(filteredTracks);
    });

    // Fetch playlist info
    if (playlistId) {
        try {
            const response = await fetch(`${PLAYLISTS_URL}?token=${sessionStorage.token}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error("Expected JSON but got:", text);
                throw new Error("Server did not return JSON for playlist info");
            }

            const playlistData = await response.json(); // renamed variable
            if (playlistData.playlists) {
                const playlist = playlistData.playlists.find(p => p._id === playlistId);
                if (playlist) {
                    $('#playlistname').text(playlist.name);
                    $('#playlist-description').text(
                        playlist.description || 'No description'
                    );
                    let image = playlist.playlistpicture || (playlist.tracks && playlist.tracks[0]?.albumImage) || "";
                    $('#playlist-image').css('background-image', image ? `url('${image}')` : 'none');
                }
            }
        } catch (error) {
            console.error('Failed to load playlist details:', error);
            $('#playlistname').text("Playlist info unavailable");
        }
    }

    // Fetch tracks
    const tracksUrl = playlistId
        ? `${PLAYLISTS_URL}/${playlistId}/tracks?token=${sessionStorage.token}`
        : `${LIKED_SONGS_URL}?token=${sessionStorage.token}`;

    try {
        const response = await fetch(tracksUrl);
        const contentType = response.headers.get('content-type');

        let jsonData;
        if (contentType && contentType.includes('application/json')) {
            jsonData = await response.json();
        } else {
            const text = await response.text();
            console.error("Expected JSON but got:", text);
            throw new Error("Server did not return JSON");
        }

        if (!response.ok) {
            throw new Error(jsonData?.message || `Error fetching tracks: ${response.statusText}`);
        }

        const tracks = jsonData.tracks || jsonData.likedSongs || [];
        trackData = tracks.map(track => {
            // Check both possibilities
            const trackId = track.spotifyTrackId || track.id || track.track?.id;

            if (!trackId) {
                console.warn("Track missing ID:", track);
                return null;
            }

            return {
                id: trackId,
                name: track.name || '',
                artist: track.artist || '',
                album: track.album || '',
                durationMs: track.durationMs || 0,
                albumImage: track.albumImage || track.album?.images?.[0]?.url || ''
            };
        }).filter(track => track !== null);

        renderPlaylist(trackData);

        if (iFrameAPI && !embedController && trackData.length > 0) {
            initSpotifyPlayer(trackData[0].id);
        }

    } catch (error) {
        console.error('Failed to load playlist:', error);
        $('#playlist-container').html(`<p class="text-danger">Error: ${error.message}</p>`);
    }

    // Fetch tracks
    const url = playlistId
        ? `${PLAYLISTS_URL}/${playlistId}/tracks?token=${sessionStorage.token}`
        : `${LIKED_SONGS_URL}?token=${sessionStorage.token}`;

    try {
        const response = await fetch(url);

        const contentType = response.headers.get('content-type');
        let jsonData;  // renamed from 'data'

        if (contentType && contentType.includes('application/json')) {
            jsonData = await response.json();  // assign, not redeclare
        } else {
            const text = await response.text();
            console.error("Expected JSON but got:", text);
            throw new Error("Server did not return JSON");
        }

        if (!response.ok) {
            throw new Error(jsonData?.message || `Error fetching playlist: ${response.statusText}`);
        }

        // Use jsonData instead of data
        // In your fetch/processing code, use:
        const tracks = jsonData.tracks || jsonData.likedSongs || [];
        console.log("First track example:", tracks[0]); // Debug

        trackData = tracks.map(track => {
            // The correct property is spotifyTrackId
            const trackId = track.spotifyTrackId;

            if (!trackId) {
                console.warn("Track missing spotifyTrackId:", track);
                return null;
            }

            return {
                id: trackId,  // Use spotifyTrackId as the ID
                name: track.name || '',
                artist: track.artist || '',
                album: track.album || '',
                durationMs: track.durationMs || 0,
                albumImage: track.albumImage || ''
            };
        }).filter(track => track !== null); // Filter out null tracks

        // Then check if we have valid tracks before initializing player
        if (trackData.length > 0 && trackData[0].id) {
            console.log("First track ID:", trackData[0].id);
            if (iFrameAPI && !embedController) {
                initSpotifyPlayer(trackData[0].id);
            }
        } else {
            console.error("No valid tracks found or first track missing ID");
        }
    } catch (error) {
        console.error('Failed to load playlist:', error);
        $('#playlist-container').html(`<p class="text-danger">Error: ${error.message}</p>`);
    }
});

// --- Helper Functions ---

async function getLyrics(trackId) {
    if (!trackId) return;
    try {
        const response = await fetch(`/lyrics/${trackId}?token=${sessionStorage.token}`);
        const data = await response.json();
        $('#lyrics-content').text(data.lyrics || "Lyrics not found.").css('white-space', 'pre-wrap');
    } catch (error) {
        console.error("Error fetching lyrics:", error);
        $('#lyrics-content').text("Lyrics not found.");
    }
}

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function deleteTrack(trackId) {
    if (!confirm("Are you sure you want to remove this track?")) return;

    const deleteUrl = playlistId
        ? `${PLAYLISTS_URL}/${playlistId}/tracks/${trackId}?token=${sessionStorage.token}`
        : `${LIKED_SONGS_URL}/${trackId}?token=${sessionStorage.token}`;

    try {
        const response = await fetch(deleteUrl, { method: 'DELETE' });
        if (response.ok) {
            trackData = trackData.filter(track => track.id !== trackId);
            renderPlaylist(trackData);
        } else {
            const data = await response.json();
            alert(data.message || "Failed to delete track.");
        }
    } catch (error) {
        console.error("Error deleting track:", error);
    }
}

// In renderPlaylist function:
function renderPlaylist(tracks) {
    const container = $('#playlist-container');
    if (!container.length) return;

    container.html(tracks.map((track, index) => {
        if (!track.id) return ''; // Skip tracks without ID

        return `
        <div data-id="${track.id}" class="song-row row mx-0 align-items-center py-2 rounded-lg cursor-pointer">
            <div class="col-1 text-center text-secondary track-index">
                <span>${index + 1}</span>
                <div class="track-play-btn text-success h5 mb-0">
                    <i class="bi bi-play-circle-fill"></i>
                </div>
            </div>
            <div class="col-5 d-flex align-items-center min-w-0 pr-4">
                <img src="${track.albumImage || './assets/default-album.png'}" alt="${track.album}" class="rounded me-3" style="width: 40px; height: 40px; object-fit: cover;">
                <div class="d-flex flex-column min-w-0">
                    <p class="mb-0 text-white fw-semibold text-truncate">${track.name}</p>
                    <p class="mb-0 small text-secondary">${track.artist}</p>
                </div>
            </div>
            <div class="col-4 d-none d-sm-block small text-secondary text-truncate">${track.album}</div>
            <div class="col-1 text-center">
                <button class="btn btn-link text-secondary p-0 delete-track-btn" data-id="${track.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
            <div class="col-1 small text-secondary text-end">${formatDuration(track.durationMs)}</div>
        </div>
        `;
    }).join(''));
}

function renderFullPlaylist() {
    renderPlaylist(trackData);
}

function initSpotifyPlayer(firstTrackId) {
    const element = $('#spotify-player-container')[0];
    if (!element || !iFrameAPI) return;

    const options = { width: '100%', height: '96', uri: `spotify:track:${firstTrackId}` };
    currentTrackId = firstTrackId;

    iFrameAPI.createController(element, options, (Controller) => {
        embedController = Controller;
    });
}

function loadNewTrack(trackId) {
    if (!trackId) {
        console.error("Error: Invalid Track ID");
        return;
    }
    if (embedController) {
        currentTrackId = trackId;
        embedController.loadUri(`spotify:track:${trackId}`).then(() => {
            embedController.togglePlay();
        }).catch(error => console.error("Error loading track in Spotify player:", error));
    } else {
        console.error("Player controller not yet initialized.");
    }
}