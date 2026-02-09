const urlParams = new URLSearchParams(window.location.search);
const playlistId = urlParams.get('id');
const isPublicView = urlParams.get('view') === 'public';

let embedController = null;
let trackData = [];
let iFrameAPI = null;
let currentTrackId = null;

window.onSpotifyIframeApiReady = (IFrameAPI) => {
    iFrameAPI = IFrameAPI;
    if (trackData.length > 0 && !embedController) {
        initSpotifyPlayer(trackData[0].id);
    }
};

$(async function () {
    // Check authentication for non-public views
    if (!isPublicView && !sessionStorage.token) {
        window.location.href = 'login.html';
        return;
    }

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

    // Fetch playlist info and tracks based on view type
    if (isPublicView) {
        await loadPublicPlaylist();
    } else {
        await loadPrivatePlaylist();
    }
});

// --- Helper Functions ---

async function loadPublicPlaylist() {
    if (!playlistId) {
        showNotification("Playlist ID not found", 'error');
        window.location.href = 'publicplaylist.html';
        return;
    }

    try {
        console.log('Loading public playlist:', playlistId);

        // For public view, use the public endpoint
        const response = await fetch(`${BASE_URL}/playlists/public/${playlistId}/tracks`);

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `HTTP ${response.status}`;

            if (response.status === 403) {
                showNotification("This playlist is private", 'error');
                setTimeout(() => {
                    window.location.href = 'publicplaylist.html';
                }, 2000);
                return;
            } else if (response.status === 404) {
                showNotification("Playlist not found", 'error');
                setTimeout(() => {
                    window.location.href = 'publicplaylist.html';
                }, 2000);
                return;
            }
            throw new Error(errorMessage);
        }

        const jsonData = await response.json();
        console.log('Public playlist data:', jsonData);

        if (!jsonData.success) {
            showNotification(jsonData.message || "Failed to load playlist", 'error');
            return;
        }

        // Set playlist info
        $('#playlistname').text(jsonData.playlist.name);
        $('#playlist-description').text(jsonData.playlist.description || 'No description');

        // Format creator info
        const creatorName = jsonData.playlist.creator?.username || 'Unknown User';
        const creatorHtml = `<span class="badge bg-success" style="font-size: 0.6em; vertical-align: middle;">By ${creatorName}</span>`;
        $('#playlistname').append(` ${creatorHtml}`);

        // Get image from first track or use default
        if (jsonData.tracks && jsonData.tracks.length > 0 && jsonData.tracks[0].albumImage) {
            $('#playlist-image').css('background-image',
                `url('${jsonData.tracks[0].albumImage}')`);
        } else {
            $('#playlist-image').css('background-image', `url('./assets/default-album.png')`);
        }

        // Process tracks
        trackData = (jsonData.tracks || []).map(track => ({
            id: track.spotifyTrackId,
            name: track.name || '',
            artist: track.artist || '',
            album: track.album || '',
            durationMs: track.durationMs || 0,
            albumImage: track.albumImage || './assets/default-album.png'
        })).filter(track => track.id);

        console.log('Processed track data:', trackData);

        renderPlaylist(trackData);

        // Initialize player if we have tracks
        if (trackData.length > 0) {
            if (iFrameAPI && !embedController) {
                initSpotifyPlayer(trackData[0].id);
            }
        } else {
            $('#playlist-container').html('<p class="text-center text-secondary">No tracks in this playlist</p>');
        }

    } catch (error) {
        console.error('Failed to load public playlist:', error);
        showNotification('Error loading playlist: ' + error.message, 'error');
        $('#playlist-container').html(`<p class="text-danger text-center">Error: ${error.message}</p>`);
    }
}

async function loadPrivatePlaylist() {
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

            const playlistData = await response.json();
            if (playlistData.playlists) {
                const playlist = playlistData.playlists.find(p => p._id === playlistId);
                if (playlist) {
                    $('#playlistname').text(playlist.name);
                    $('#playlist-description').text(
                        playlist.description || 'No description'
                    );

                    // Set playlist image
                    let image = playlist.playlistpicture ||
                        (playlist.tracks && playlist.tracks[0]?.albumImage) ||
                        './assets/default-album.png';
                    $('#playlist-image').css('background-image', `url('${image}')`);

                    // Add public/private indicator
                    const visibilityBadge = playlist.isPublic
                        ? '<span class="badge bg-success" style="font-size: 0.6em; vertical-align: middle;">Public</span>'
                        : '<span class="badge bg-secondary" style="font-size: 0.6em; vertical-align: middle;">Private</span>';
                    $('#playlistname').append(` ${visibilityBadge}`);
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
                albumImage: track.albumImage || track.album?.images?.[0]?.url || './assets/default-album.png'
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
}

async function getLyrics(trackId) {
    if (!trackId) return;
    try {
        const track = trackData.find(t => t.id === trackId);
        if (!track) {
            $('#lyrics-content').text("Track not found in playlist.");
            return;
        }

        // Always try to use the token if available (user is logged in)
        const token = sessionStorage.token;
        const tokenParam = token ? `?token=${token}` : '';
        const url = `${BASE_URL}/lyrics/${trackId}${tokenParam}&songName=${encodeURIComponent(track.name)}&artist=${encodeURIComponent(track.artist)}`;

        console.log('Fetching lyrics from:', url);

        const response = await fetch(url);

        if (!response.ok) {
            console.error('Lyrics fetch failed:', response.status, response.statusText);
            // Try without token as fallback
            if (token && response.status === 401) {
                const fallbackUrl = `${BASE_URL}/lyrics/${trackId}?songName=${encodeURIComponent(track.name)}&artist=${encodeURIComponent(track.artist)}`;
                console.log('Trying fallback URL:', fallbackUrl);
                const fallbackResponse = await fetch(fallbackUrl);
                if (fallbackResponse.ok) {
                    const data = await fallbackResponse.json();
                    if (data.success && data.lyrics) {
                        $('#lyrics-content').text(data.lyrics).css('white-space', 'pre-wrap');
                        return;
                    }
                }
            }
            $('#lyrics-content').text("Error fetching lyrics.");
            return;
        }

        const data = await response.json();
        if (data.success && data.lyrics) {
            $('#lyrics-content').text(data.lyrics).css('white-space', 'pre-wrap');
        } else {
            $('#lyrics-content').text("Lyrics not found. " + (data.message || ""));
        }
    } catch (error) {
        console.error("Error fetching lyrics:", error);
        $('#lyrics-content').text("Error fetching lyrics. Please try again.");
    }
}

function formatDuration(ms) {
    if (!ms || ms <= 0) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function deleteTrack(trackId) {
    if (isPublicView) {
        showNotification("Cannot delete tracks from a public playlist. Clone it first to make edits.", 'error');
        return;
    }
    if (!confirm("Are you sure you want to remove this track?")) return;

    const deleteUrl = playlistId
        ? `${PLAYLISTS_URL}/${playlistId}/tracks/${trackId}?token=${sessionStorage.token}`
        : `${LIKED_SONGS_URL}/${trackId}?token=${sessionStorage.token}`;

    try {
        const response = await fetch(deleteUrl, { method: 'DELETE' });
        if (response.ok) {
            trackData = trackData.filter(track => track.id !== trackId);
            renderPlaylist(trackData);
            showNotification("Track removed successfully", 'success');
        } else {
            const data = await response.json();
            showNotification(data.message || "Failed to delete track.", 'error');
        }
    } catch (error) {
        console.error("Error deleting track:", error);
        showNotification("Error deleting track", 'error');
    }
}

function renderPlaylist(tracks) {
    const container = $('#playlist-container');
    if (!container.length) return;

    if (tracks.length === 0) {
        container.html('<p class="text-center text-secondary">No tracks in this playlist</p>');
        return;
    }

    container.html(tracks.map((track, index) => {
        if (!track.id) return '';

        return `
        <div data-id="${track.id}" class="song-row row mx-0 align-items-center py-2 rounded-lg cursor-pointer">
            <div class="col-1 text-center text-secondary track-index">
                <span>${index + 1}</span>
                <div class="track-play-btn text-success h5 mb-0">
                    <i class="bi bi-play-circle-fill"></i>
                </div>
            </div>
            <div class="col-5 d-flex align-items-center min-w-0 pr-4">
                <img src="${track.albumImage || './assets/default-album.png'}" alt="${track.album || 'Album'}" class="rounded me-3" style="width: 40px; height: 40px; object-fit: cover;">
                <div class="d-flex flex-column min-w-0">
                    <p class="mb-0 text-white fw-semibold text-truncate">${track.name || 'Unknown Track'}</p>
                    <p class="mb-0 small text-secondary">${track.artist || 'Unknown Artist'}</p>
                </div>
            </div>
            <div class="col-4 d-none d-sm-block small text-secondary text-truncate">${track.album || 'Unknown Album'}</div>
            <div class="col-1 text-center">
                <button class="btn btn-link text-secondary p-0 delete-track-btn" data-id="${track.id}" ${isPublicView ? 'style="display: none;"' : ''}>
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

function showNotification(message, type = 'success', duration = 3000) {
    // Remove existing notification if any
    $('#notification').remove();

    // Create notification
    $('body').append(`
        <div id="notification" class="${type}">
            <span id="notification-text">${message}</span>
        </div>
    `);

    // Show with animation
    $('#notification').css('display', 'block');
    setTimeout(() => {
        $('#notification').addClass('show');
    }, 10);

    // Auto hide
    setTimeout(() => {
        $('#notification').removeClass('show');
        setTimeout(() => {
            $('#notification').remove();
        }, 300);
    }, duration);

    // Click to dismiss
    $('#notification').on('click', function () {
        $(this).removeClass('show');
        setTimeout(() => $(this).remove(), 300);
    });
}
