$(async function () {
    // Search functionality
    const searchInput = $("#search-input");

    let searchTimeout;
    searchInput.on("input", function () {
        const query = $(this).val().trim();

        clearTimeout(searchTimeout);

        // Set a new timeout to avoid too many API calls - DEEPSEEK
        searchTimeout = setTimeout(() => {
            if (query) {
                searchTracks(query);
            } else {
                $("#search-results").empty();
            }
        }, 300);

    });

    // Event listeners for track actions

    if ($("#search-results").length) {
        $("#search-results").on("click", ".btn-add-playlist", function (e) {
            e.preventDefault();
            e.stopPropagation();
            // console.log("Add to playlist button clicked!"); Debug
            const trackId = $(this).closest(".track-card").data("track-id");
            // console.log("Track ID from data attribute:", trackId);  Debug
            openPlaylistModal(trackId);
        });

        $("#search-results").on("click", ".btn-like", function (e) {
            e.preventDefault();
            e.stopPropagation();
            const trackId = $(this).closest(".track-card").data("track-id");
            addToLikedSongs(trackId);
        });

        $("#search-results").on("click", ".btn-share", function (e) {
            e.preventDefault();
            e.stopPropagation();
            const trackId = $(this).closest(".track-card").data("track-id");
            openShareModal(trackId);
        });

    } else {
        console.error("#search-results element not found!");
    }

    $("body").on("click", ".close-modal", () => {
        $("#playlist-modal").hide();
        $("#create-playlist-modal").hide();
        $("#delete-playlist-modal").hide();
        $("#archive-playlist-modal").hide();
        $("#edit-playlist-modal").hide();
    });

    $("#addoption").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openCreatePlaylistModal();
    });

    $("#deleteoption").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openDeletePlaylistModal();
    });

    $("#archiveoption").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openArchivePlaylistModal();
    });

    $("#editoption").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openEditPlaylistModal();
    });

    let response = await fetch(PLAYLISTS_URL + "?token=" + sessionStorage.token);
    if (response.ok) {
        let data = await response.json();
        if (data.success) {
            displayPlaylists(data.playlists);
        }
    }
    try {
        let likedSongsCount = await fetch(LIKED_SONGS_URL + "?token=" + sessionStorage.token);
        if (likedSongsCount.ok) {
            let likedSongsData = await likedSongsCount.json();
            $("#liked-songs-count").text((likedSongsData.count || 0) + " Tracks");
        }

    } catch (error) {
        console.error("Error fetching liked songs count:", error);
    }

    $("#search-results").on("click", ".btn-like", function (e) {
        console.log("LIKE CLICKED");
        const trackId = $(this).closest(".track-card").data("track-id");
        console.log("Track ID:", trackId);
        addToLikedSongs(trackId);
    });

    $("#search-results").on("click", ".btn-add-playlist", function (e) {
        console.log("ADD TO PLAYLIST CLICKED");
        const trackId = $(this).closest(".track-card").data("track-id");
        console.log("Track ID:", trackId);
        openPlaylistModal(trackId);
    });
});

// --- Helper Functions ---

// Display friends list

const SPOTIFY_SEARCH_URL = "http://localhost:3000/spotify/search";
// Search for tracks based on query
async function searchTracks(query) {
    try {
        const response = await fetch(
            `${SPOTIFY_SEARCH_URL}?query=${encodeURIComponent(query)}&limit=20&token=${sessionStorage.token}`,
            { method: "GET" }
        );

        if (!response.ok) {
            throw new Error("Spotify search failed");
        }

        const data = await response.json();

        if (!data || !data.tracks || data.tracks.length === 0) {
            $("#search-results").html("<p>No results found.</p>");
            return;
        }

        displaySearchResults(data.tracks);

    } catch (error) {
        console.error("Spotify search error:", error);
        $("#search-results").html("<p>Failed to search Spotify.</p>");
    }
}
// Display notification message to user
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

    // Optional: Click to dismiss
    $('#notification').on('click', function () {
        $(this).removeClass('show');
        setTimeout(() => $(this).remove(), 300);
    });
}
// Function to display search results
function displaySearchResults(tracks) {
    const searchResults = $("#search-results");
    searchResults.empty();

    if (!tracks || tracks.length === 0) {
        searchResults.html("<p>No results found.</p>");
        return;
    }

    tracks.forEach(track => {
        const albumImage = track.albumImage || "./assets/default-album.png";
        const artists = track.artist || "Unknown Artist";

        const trackCard = $(`
            <div class="card track-card" data-track-id="${track.spotifyTrackId}">
                <div class="card-image"
                    style="background-image: url('${albumImage}');
                           background-size: cover;
                           background-position: center;">
                </div>

                <div class="card-info">
                    <p class="card-title">${track.name}</p>
                    <p class="card-subtitle">${artists}</p>
                </div>

                <div class="card-actions d-flex justify-content-around p-2">
                    <button class="btn btn-outline-danger btn-sm rounded-circle btn-like">
                        <i class="fa fa-heart"></i>
                    </button>
                    <button class="btn btn-outline-primary btn-sm rounded-circle btn-add-playlist">
                        <i class="fa fa-plus"></i>
                    </button>
                    <button class="btn btn-outline-primary btn-sm rounded-circle btn-share">
                        <i class="fa fa-share"></i>
                    </button>
                </div>
            </div>
        `);

        searchResults.append(trackCard);
    });
}

// Open modal to select playlist for adding track
async function openPlaylistModal(trackId) {
    let modal = $("#playlist-modal");

    if (modal.length === 0) {
        $("body").append(`
            <div id="playlist-modal" class="modal" tabindex="-1" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050; background-color: rgba(0,0,0,0.5); justify-content: center; align-items: center;">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Select Playlist</h5>
                            <button type="button" class="btn-close close-modal" aria-label="Close" style="border: none; background: none; font-size: 1.5rem;">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div id="modal-playlists-list" class="list-group">
                                <button type="button" class="list-group-item list-group-item-action">Placeholder One</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        modal = $("#playlist-modal");
    }

    modal.css("display", "flex");

    const playlistContainer = $("#modal-playlists-list");
    playlistContainer.html("<p class='text-white'>Loading...</p>");

    try {
        const response = await fetch(PLAYLISTS_URL + "?token=" + sessionStorage.token);
        if (response.ok) {
            const data = await response.json();
            playlistContainer.empty();
            if (data.success && data.playlists && data.playlists.length > 0) {
                data.playlists.forEach(playlist => {
                    const ListItemBtn = $(`<button type="button" class="list-group-item list-group-item-action">${playlist.name}</button>`);
                    ListItemBtn.on("click", async function () {
                        await addTrackToPlaylist(trackId, playlist._id);
                        modal.hide();
                    });

                    playlistContainer.append(ListItemBtn);

                })
            } else {
                playlistContainer.append("<p>No playlists found.</p>");
            }


        } else {
            playlistContainer.html("<p>Failed loading playlists.</p>");
        }

    } catch (error) {
        console.error("Error loading playlists:", error);
        playlistContainer.html("<p>Error loading playlists.</p>");

    }
}

// Add a track to a specific playlist
async function addTrackToPlaylist(trackId, playlistId) {
    try {
        const response = await fetch(
            `${PLAYLISTS_URL}/${playlistId}/tracks?token=${sessionStorage.token}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spotifyTrackId: trackId
                })
            }
        );

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification(data.message || "Track added to playlist 🎶", 'success');
        } else {
            showNotification(data.message || "Track already exists", 'error');
        }

    } catch (error) {
        console.error("Error adding track to playlist:", error);
        showNotification("Error adding track to playlist", 'error');
    }
}

// Open modal to edit a playlist
async function openEditPlaylistModal() {
    let modal = $("#edit-playlist-modal");

    if (modal.length === 0) {
        $("body").append(`
            <div id="edit-playlist-modal" class="modal" tabindex="-1" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050; background-color: rgba(0,0,0,0.5); justify-content: center; align-items: center;">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Playlist</h5>
                            <button type="button" class="btn-close close-modal" aria-label="Close" style="border: none; background: none; font-size: 1.5rem;">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div id="edit-modal-playlists-list" class="list-group">
                                <p>Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        modal = $("#edit-playlist-modal");
    }

    modal.css("display", "flex");

    const playlistContainer = $("#edit-modal-playlists-list");
    playlistContainer.html("<p>Loading...</p>");

    try {
        const response = await fetch(PLAYLISTS_URL + "?token=" + sessionStorage.token);
        if (response.ok) {
            const data = await response.json();
            playlistContainer.empty();
            if (data.success && data.playlists && data.playlists.length > 0) {
                data.playlists.forEach(playlist => {
                    const trackCount = playlist.tracks ? playlist.tracks.length : 0;
                    const item = $(`
                        <div class="list-group-item list-group-item-action">
                            <div class="fw-bold">${playlist.name}</div>
                            <div class="d-flex align-items-center mt-1">
                                <small class="text-muted me-3">${trackCount} Tracks</small>
                                <button class="btn btn-primary btn-sm edit-btn" style="padding: 0.8rem 1.5rem;">Edit</button>
                            </div>
                        </div>
                    `);

                    item.find(".edit-btn").on("click", function (e) {
                        e.stopPropagation();
                        const modalBody = modal.find(".modal-body");

                        modalBody.html(`
                            <div class="mb-3">
                                <button type="button" class="btn btn-secondary btn-sm" id="back-edit-btn" style="margin: 0;"><i class="fas fa-arrow-left"></i> Back</button>
                            </div>
                            <form id="edit-playlist-form">
                                <div class="mb-3">
                                    <label for="edit-playlist-name" class="form-label">New Playlist Name</label>
                                    <input type="text" class="form-control" id="edit-playlist-name" required>
                                </div>
                                <div class="d-flex justify-content-end">
                                    <button type="submit" class="btn btn-primary" style="margin: 0;">Save</button>
                                </div>
                            </form>
                        `);
                        $("#edit-playlist-name").val(playlist.name).focus();

                        $("#back-edit-btn").on("click", function () {
                            modalBody.html('<div id="edit-modal-playlists-list" class="list-group"><p>Loading...</p></div>');
                            openEditPlaylistModal();
                        });

                        $("#edit-playlist-form").on("submit", async function (ev) {
                            ev.preventDefault();
                            const newName = $("#edit-playlist-name").val();
                            if (newName && newName.trim() !== "") {
                                const success = await updatePlaylist(playlist._id, newName.trim());
                                if (success) {
                                    modalBody.html('<div id="edit-modal-playlists-list" class="list-group"><p>Loading...</p></div>');
                                    openEditPlaylistModal();
                                }
                            }
                        });
                    });

                    playlistContainer.append(item);
                });
            } else {
                playlistContainer.append("<p>No playlists found.</p>");
            }
        } else {
            playlistContainer.html("<p>Failed loading playlists.</p>");
        }
    } catch (error) {
        console.error("Error loading playlists:", error);
        playlistContainer.html("<p>Error loading playlists.</p>");
    }
}

// Update playlist name
async function updatePlaylist(playlistId, newName) {
    try {
        const response = await fetch(`${PLAYLISTS_URL}/${playlistId}?token=${sessionStorage.token}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newName })
        });
        const data = await response.json();
        if (response.ok) {
            showNotification(data.message, 'success');
            // Refresh playlists (Deepseek R1)
            let resp = await fetch(PLAYLISTS_URL + "?token=" + sessionStorage.token);
            if (resp.ok) {
                let d = await resp.json();
                if (d.success) {
                    displayPlaylists(d.playlists);
                }
            }
            return true;
        } else {
            showNotification(data.message || "Failed to update playlist", 'error');
            return false;
        }
    } catch (error) {
        console.error("Error updating playlist:", error);
        showNotification("Error updating playlist", 'error');
        return false;
    }
}

// Add a track to liked songs
async function addToLikedSongs(trackId) {
    try {
        const response = await fetch(
            `${LIKED_SONGS_URL}?token=${sessionStorage.token}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ spotifyTrackId: trackId })
            }
        );

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification(data.message || "Added to Liked Songs ❤️", 'success');
        } else {
            showNotification(data.message || "Already in Liked Songs", 'error');
        }

    } catch (error) {
        console.error("Error adding to liked songs:", error);
        showNotification("Failed to add to Liked Songs", 'error');
    }
}

// Open modal to archive a playlist
async function openArchivePlaylistModal() {
    let modal = $("#archive-playlist-modal");

    if (modal.length === 0) {
        $("body").append(`
            <div id="archive-playlist-modal" class="modal" tabindex="-1" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050; background-color: rgba(0,0,0,0.5); justify-content: center; align-items: center;">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Archive Playlist</h5>
                            <button type="button" class="btn-close close-modal" aria-label="Close" style="border: none; background: none; font-size: 1.5rem;">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div id="archive-modal-playlists-list" class="list-group">
                                <p>Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        modal = $("#archive-playlist-modal");
    }

    modal.css("display", "flex");

    const playlistContainer = $("#archive-modal-playlists-list");
    playlistContainer.html("<p>Loading...</p>");

    try {
        const response = await fetch(PLAYLISTS_URL + "?token=" + sessionStorage.token);
        if (response.ok) {
            const data = await response.json();
            playlistContainer.empty();
            if (data.success && data.playlists && data.playlists.length > 0) {
                data.playlists.forEach(playlist => {
                    const trackCount = playlist.tracks ? playlist.tracks.length : 0;
                    const item = $(`
                        <div class="list-group-item list-group-item-action">
                            <div class="fw-bold">${playlist.name}</div>
                            <div class="d-flex align-items-center mt-1">
                                <small class="text-muted me-3">${trackCount} Tracks</small>
                                <button class="btn btn-warning btn-sm archive-btn" id="archive-btn">Archive</button>
                            </div>
                        </div>
                    `);

                    item.find(".archive-btn").on("click", async function (e) {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to archive "${playlist.name}"?`)) {
                            await archivePlaylist(playlist._id);
                            modal.hide();
                        }
                    });

                    playlistContainer.append(item);
                });
            } else {
                playlistContainer.append("<p>No playlists found.</p>");
            }
        } else {
            playlistContainer.html("<p>Failed loading playlists.</p>");
        }
    } catch (error) {
        console.error("Error loading playlists:", error);
        playlistContainer.html("<p>Error loading playlists.</p>");
    }
}

// Archive a playlist
async function archivePlaylist(playlistId) {
    try {
        const response = await fetch(`${PLAYLISTS_URL}/${playlistId}/archive?token=${sessionStorage.token}`, {
            method: 'POST'
        });
        const data = await response.json();
        if (response.ok) {
            showNotification(data.message, 'success');
            // Refresh playlists
            let resp = await fetch(PLAYLISTS_URL + "?token=" + sessionStorage.token);
            if (resp.ok) {
                let d = await resp.json();
                if (d.success) {
                    displayPlaylists(d.playlists);
                }
            }
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error("Error archiving playlist:", error);
        showNotification("Error archiving playlist", 'error');
    }
}

// Display playlists in UI
function displayPlaylists(playlists) {
    const container = $("#user-playlists-container");

    // Clear existing playlists except the liked songs card
    container.find(".playlist-card").remove();

    if (playlists.length === 0) {
        return;
    }

    playlists.forEach(function (playlist) {
        let image = playlist.playlistpicture;
        if (!image && playlist.tracks && playlist.tracks.length > 0) {
            image = playlist.tracks[0].albumImage;
        }
        image = image || "./assets/default-album.png";

        const card = $(`
            <a href="playlist.html?id=${playlist._id}" class="card playlist-card" style="width: 200px;">
                <div class="card-image" style="background-image: url('${image}'); background-size: cover; background-position: center;"></div>
                <div class="card-info">
                    <p class="card-title">${playlist.name}</p>
                    <p class="card-subtitle">${playlist.tracks ? playlist.tracks.length : 0} Tracks</p>
                </div>
            </a>
        `);
        container.append(card);
    });
}

// Open modal to create a new playlist
function openCreatePlaylistModal() {
    let modal = $("#create-playlist-modal");

    if (modal.length === 0) {
        $("body").append(`
            <div id="create-playlist-modal" class="modal" tabindex="-1" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050; background-color: rgba(0,0,0,0.5); justify-content: center; align-items: center;">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Create Playlist</h5>
                            <button type="button" class="btn-close close-modal" aria-label="Close" style="border: none; background: none; font-size: 1.5rem;">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="create-playlist-form">
                                <div class="mb-3">
                                    <label for="playlist-name" class="form-label">Playlist Name</label>
                                    <input type="text" class="form-control" id="playlist-name" required>
                                </div>
                                <button type="submit" class="btn btn-primary">Create</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `);
        modal = $("#create-playlist-modal");

        $("#create-playlist-form").on("submit", async function (e) {
            e.preventDefault();
            const playlistName = $("#playlist-name").val();
            if (playlistName) {
                await createPlaylist(playlistName);
                $("#playlist-name").val("");
                modal.hide();
            }
        });
    }

    modal.css("display", "flex");
}

// Create a new playlist
async function createPlaylist(name) {
    try {
        const response = await fetch(PLAYLISTS_URL + '/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: name, token: sessionStorage.token })
        });

        if (response.ok) {
            let response = await fetch(PLAYLISTS_URL + "?token=" + sessionStorage.token);
            if (response.ok) {
                let data = await response.json();
                if (data.success) {
                    displayPlaylists(data.playlists);
                }
            }
        } else {
            console.error("Failed to create playlist:", await response.json());
        }
    } catch (error) {
        console.error("Error creating playlist:", error);
    }
}

// Open modal to delete a playlist
async function openDeletePlaylistModal() {
    let modal = $("#delete-playlist-modal");

    if (modal.length === 0) {
        $("body").append(`
            <div id="delete-playlist-modal" class="modal" tabindex="-1" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050; background-color: rgba(0,0,0,0.5); justify-content: center; align-items: center;">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Delete Playlist</h5>
                            <button type="button" class="btn-close close-modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div id="delete-modal-playlists-list" class="list-group">
                                <p>Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        modal = $("#delete-playlist-modal");
    }

    modal.css("display", "flex");

    const playlistContainer = $("#delete-modal-playlists-list");
    playlistContainer.html("<p>Loading...</p>");

    try {
        const response = await fetch(PLAYLISTS_URL + "?token=" + sessionStorage.token);
        if (response.ok) {
            const data = await response.json();
            playlistContainer.empty();
            if (data.success && data.playlists && data.playlists.length > 0) {
                data.playlists.forEach(playlist => {
                    const trackCount = playlist.tracks ? playlist.tracks.length : 0;
                    const item = $(`
                        <div class="list-group-item list-group-item-action">
                            <div class="fw-bold">${playlist.name}</div>
                            <div class="d-flex align-items-center mt-1">
                                <small class="text-muted me-3">${trackCount} Tracks</small>
                                <button class="btn btn-danger btn-sm delete-btn">Delete</button>
                            </div>
                        </div>
                    `);

                    item.find(".delete-btn").on("click", async function (e) {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
                            await deletePlaylist(playlist._id);
                            modal.hide();
                        }
                    });

                    playlistContainer.append(item);
                });
            } else {
                playlistContainer.append("<p>No playlists found.</p>");
            }
        } else {
            playlistContainer.html("<p>Failed loading playlists.</p>");
        }
    } catch (error) {
        console.error("Error loading playlists:", error);
        playlistContainer.html("<p>Error loading playlists.</p>");
    }
}

// Delete a playlist
async function deletePlaylist(playlistId) {
    try {
        const response = await fetch(`${PLAYLISTS_URL}/${playlistId}?token=${sessionStorage.token}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (response.ok) {
            showNotification(data.message, 'success');
            // Refresh playlists
            let resp = await fetch(PLAYLISTS_URL + "?token=" + sessionStorage.token);
            if (resp.ok) {
                let d = await resp.json();
                if (d.success) {
                    displayPlaylists(d.playlists);
                }
            }
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error("Error deleting playlist:", error);
        showNotification("Error deleting playlist", 'error');
    }

}
async function openShareModal(trackId) {
    let modal = $("#share-modal");

    if (modal.length === 0) {
        $("body").append(`
            <div id="share-modal" class="modal" tabindex="-1" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050; background-color: rgba(0,0,0,0.5); justify-content: center; align-items: center;">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Share with Friend</h5>
                            <button type="button" class="btn-close close-modal" aria-label="Close" style="border: none; background: none; font-size: 1.5rem;">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div id="share-modal-friends-list" class="list-group">
                                <p>Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        modal = $("#share-modal");

        modal.find(".close-modal").on("click", function () {
            modal.hide();
        });
    }

    modal.css("display", "flex");

    getFriends(trackId);
}

async function getFriends(trackId) {
    const friendsListContainer = $("#share-modal-friends-list");
    friendsListContainer.html("<p>Loading...</p>");

    try {
        const response = await fetch(`${FRIENDS_URL}?token=${sessionStorage.token}`);
        if (response.ok) {
            const data = await response.json();

            if (data.success && data.message) {
                const friends = data.message.filter(f => f.status === 'accepted');
                displayShareFriends(friends, trackId);
            } else {
                friendsListContainer.html("<p>No friends found.</p>");
            }
        } else {
            friendsListContainer.html("<p>Failed to load friends.</p>");
        }
    } catch (error) {
        console.error("Error loading friends:", error);
        friendsListContainer.html("<p>Error loading friends.</p>");
    }
}

function displayShareFriends(friends, trackId) {
    const friendsListContainer = $("#share-modal-friends-list");
    friendsListContainer.empty();
    let modal = $("#share-modal");

    if (friends.length > 0) {
        friends.forEach(friendship => {
            const friend = friendship.user;
            if (!friend) return;

            const item = $(`
                <button type="button" class="list-group-item list-group-item-action">
                    <div class="d-flex flex-column">
                        <span class="fw-bold">${friend.username}</span>
                        <small class="text-muted">${friend.email}</small>
                    </div>
                </button>
            `);

            item.on("click", function () {
                shareSongUrl(trackId, friend._id);
                showNotification(`Shared a song with ${friend.username}`, 'success');
                modal.hide();
            });

            friendsListContainer.append(item);
        });
    } else {
        friendsListContainer.html("<p>No friends found.</p>");
    }
}

async function shareSongUrl(trackId, receiverId) {
    try {
        const response = await fetch(`${MESSAGES_URL}/send?token=${sessionStorage.token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                receiverId: receiverId,
                url: `Check out this track: https://open.spotify.com/track/${trackId}`
            })
        });
        const data = await response.json();
    } catch (error) {
        console.error("Error sharing song URL:", error);
    }
}