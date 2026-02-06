let embedController = null;
let isPlaying = false;
let trackData = [];
let iFrameAPI = null;

window.onSpotifyIframeApiReady = (IFrameAPI) => {
    iFrameAPI = IFrameAPI;
    if (trackData.length > 0 && !embedController) {
        initSpotifyPlayer(trackData[0].id);
    }
};

// Initialize UI components
$(async function () {

    $('#playlist-container').on('click', '.song-row', function () {
        const trackId = $(this).attr('data-id');
        loadNewTrack(trackId);
    });

    $('#playlist-container').on('click', '.delete-track-btn', function (e) {
        e.stopPropagation();
        const trackId = $(this).attr('data-id');
        deleteTrack(trackId);
    });

    // Lyrics Sidebar Toggle
    const lyricsBtn = $('#lyrics-toggle-btn');
    const lyricsCol = $('#lyrics-column');
    const playlistCol = $('#playlist-column');

    lyricsBtn.on('click', function () {
        lyricsCol.toggleClass('d-none');

        // Toggle button active state and adjust layout
        if (!lyricsCol.hasClass('d-none')) {
            lyricsBtn.removeClass('text-secondary').addClass('text-success');
            playlistCol.removeClass('mx-auto'); // Align left when sidebar is open
        } else {
            lyricsBtn.addClass('text-secondary').removeClass('text-success');
            playlistCol.addClass('mx-auto'); // Center when sidebar is closed
        }
    });

    const searchBar = $('#search-bar');
    searchBar.on('input', function () {
        const searchTerm = $(this).val().toLowerCase().trim();

        if (searchTerm === '') {
            renderFullPlaylist();
            return;
        }

        // Score tracks based on match quality
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
            else score = 0;

            return { ...track, score };
        }).filter(track => track.score > 0)
            .sort((a, b) => b.score - a.score);

        const filteredTracks = scoredTracks.map(({ score, ...track }) => track);

        renderPlaylist(filteredTracks);
    });


    const url = `${LIKED_SONGS_URL}?token=${sessionStorage.token}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error fetching liked songs: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success && data.likedSongs) {
            trackData = data.likedSongs.map(track => ({
                id: track.spotifyTrackId,
                name: track.name,
                artist: track.artist,
                album: track.album,
                durationMs: track.durationMs,
                albumImage: track.albumImage
            }));
            renderPlaylist(trackData);
            // Initialize player with the first track if API is ready
            if (iFrameAPI && !embedController && trackData.length > 0) {
                initSpotifyPlayer(trackData[0].id);
            }
        } else {
            if (data.success && (!data.likedSongs || data.likedSongs.length === 0)) {
                $('#playlist-container').html('<p class="text-white">No liked songs yet.</p>');
            } else {
                throw new Error(data.message || 'Could not retrieve liked songs.');
            }
        }
    } catch (error) {
        console.error('Failed to load liked songs:', error);
        $('#playlist-container').html(`<p class="text-danger">Error: ${error.message}</p>`);
    }
});

// --- Helper Functions ---

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `:${seconds.toString().padStart(2, '0')}`;
}

async function deleteTrack(trackId) {
    try {
        const response = await fetch(`${LIKED_SONGS_URL}/${trackId}?token=${sessionStorage.token}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            trackData = trackData.filter(track => track.id !== trackId);
            renderPlaylist(trackData);
        } else {
            const data = await response.json();
            alert(data.message || "Failed to remove track.");
        }
    } catch (error) {
        console.error("Error removing track:", error);
    }
}

function renderPlaylist(tracks) {
    const container = $('#playlist-container');
    if (container.length === 0) {
        console.error("Error: Playlist container element not found.");
        return;
    }

    container.html(tracks.map((track, index) => {

        return `
                    <div 
                        data-id="${track.id}"
                        class="song-row row mx-0 align-items-center py-2 rounded-lg cursor-pointer"
                    >
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

                        <div class="col-4 d-none d-sm-block small text-secondary text-truncate">
                            ${track.album}
                        </div>
                        <div class="col-1 text-center">
                            <button class="btn btn-link text-secondary p-0 delete-track-btn" data-id="${track.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>

                        <div class="col-1 small text-secondary text-end">
                            ${formatDuration(track.durationMs)}
                        </div>


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

    const options = {
        width: '100%',
        height: '96',
        uri: `spotify:track:${firstTrackId}`
    };

    const callback = (Controller) => {
        embedController = Controller;
        // console.log("Spotify Embed Controller initialized.");
    };

    iFrameAPI.createController(element, options, callback);
}

function loadNewTrack(trackId) {
    if (!trackId || trackId === 'undefined') {
        console.error("Error: Invalid Track ID");
        return;
    }
    if (embedController) {
        const trackUri = `spotify:track:${trackId}`;
        embedController.loadUri(trackUri).then(() => {
            // Start playing immediately after loading
            embedController.togglePlay();
        }).catch(error => {
            console.error("Error loading track in Spotify player:", error);
        });
    } else {
        console.error("Player controller not yet initialized.");
    }
}
