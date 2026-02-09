$(async function () {
    // Search functionality
    const searchInput = $("#search-input");

    let searchTimeout;
    searchInput.on("input", function () {
        const query = $(this).val().trim();

        clearTimeout(searchTimeout);

        // Set a new timeout to avoid too many API calls
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
    } else {
        console.error("#search-results element not found!");
    }

    $("body").on("click", ".close-modal", () => {
        $("#playlist-modal").hide();
        $("#create-playlist-modal").hide();
        $("#delete-playlist-modal").hide();
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

    $("#editoption").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openEditPlaylistModal();
    });

    // Open create playlist modal when the card is clicked
    $("body").on("click", "#create-playlist-card", function () {
        openCreatePlaylistModal();
    });

    let response = await fetch(PLAYLISTS_URL + "?token=" + sessionStorage.token);
    if (response.ok) {
        let data = await response.json();
        if (data.playlists) {
            displayPlaylists(data.playlists);
        }
    }
    try {
        await loadLikedSongsCount();
    } catch (err) {
        console.error(err);
    }
});

// --- Helper Functions ---

// Search for tracks based on query
async function searchTracks(query) {
    try {
        const response = await fetch(
            `/spotify/search?query=${encodeURIComponent(query)}&token=${sessionStorage.token}`
        );

        if (response.ok) {
            const data = await response.json();
            displaySearchResults(data.tracks || data);
        } else {
            $("#search-results").html("<p>Search failed.</p>");
        }
    } catch (error) {
        console.error("Error during search:", error);
        $("#search-results").html("<p>Error occurred.</p>");
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

    if (tracks.length === 0) {
        searchResults.html("<p>No results found.</p>");
        return;
    }

    tracks.forEach(track => {
        const albumImage = track.albumImage ? track.albumImage : "./assets/default-album.png";
        const artists = track.artist;

        const trackCard = $(`
            <div class="card track-card" data-track-id="${track.spotifyTrackId}">
                <div class="card-image" style="background-image: url('${albumImage}'); background-size: cover; background-position: center;"></div>
                <div class="card-info">
                    <p class="card-title">${track.name}</p>
                    <p class="card-subtitle">${artists}</p>
                </div>
                <div class="card-actions d-flex justify-content-around p-2">
                    <button class="btn btn-outline-danger btn-sm rounded-circle btn-like" title="Like"><i class="fa fa-heart"></i></button>
                    <button class="btn btn-outline-primary btn-sm rounded-circle btn-add-playlist" title="Add to Playlist"><i class="fa fa-plus"></i></button>
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
            if (data.playlists && data.playlists.length > 0) {
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
        // First get the track details from the search results or fetch from Spotify
        const trackElement = $(`.track-card[data-track-id="${trackId}"]`);

        let trackData;

        if (trackElement.length) {
            // Extract from the DOM element if available
            const name = trackElement.find('.card-title').text();
            const artist = trackElement.find('.card-subtitle').text();
            const albumImage = trackElement.find('.card-image').css('background-image').replace(/url\(['"]?(.*?)['"]?\)/, '$1');

            trackData = {
                spotifyTrackId: trackId,
                name: name,
                artist: artist,
                albumImage: albumImage
            };
        } else {
            // Fallback: fetch from Spotify API
            const trackResponse = await fetch(
                `${BASE_URL}/spotify/track/${trackId}?token=${sessionStorage.token}`
            );

            if (!trackResponse.ok) {
                throw new Error('Failed to fetch track details');
            }

            const result = await trackResponse.json();
            trackData = result.track || result;
        }

        console.log("Sending track data to backend:", trackData);

        const response = await fetch(
            `${PLAYLISTS_URL}/${playlistId}/tracks?token=${sessionStorage.token}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(trackData)
            }
        );

        const data = await response.json();

        if (response.ok) {
            showNotification(data.message || "Track added to playlist", 'success');
        } else {
            showNotification(data.message || "Failed to add track", 'error');
        }

    } catch (error) {
        console.error("Error adding track to playlist:", error);
        showNotification("Error adding track to playlist: " + error.message, 'error');
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

async function openEditPlaylistModalById(playlistId) {
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
                            <form id="edit-playlist-form">
                                <div class="mb-3">
                                    <label for="edit-playlist-name" class="form-label">Playlist Name</label>
                                    <input type="text" class="form-control" id="edit-playlist-name" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-playlist-description" class="form-label">Description</label>
                                    <textarea class="form-control" id="edit-playlist-description" rows="2"></textarea>
                                </div>
                                <div class="d-flex justify-content-end">
                                    <button type="submit" class="btn btn-primary">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `);
        modal = $("#edit-playlist-modal");
    }

    modal.css("display", "flex");

    try {
        // Fetch playlist details
        const response = await fetch(`${PLAYLISTS_URL}?token=${sessionStorage.token}`);
        if (response.ok) {
            const data = await response.json();
            const playlist = data.playlists.find(p => p._id === playlistId);
            if (!playlist) throw new Error("Playlist not found");

            $("#edit-playlist-name").val(playlist.name).focus();
            $("#edit-playlist-description").val(playlist.description || "");

            $("#edit-playlist-form").off("submit").on("submit", async function (e) {
                e.preventDefault();
                const newName = $("#edit-playlist-name").val().trim();
                const newDesc = $("#edit-playlist-description").val().trim();

                if (newName) {
                    await updatePlaylist(playlistId, { name: newName, description: newDesc });
                    modal.hide();
                }
            });
        }
    } catch (err) {
        console.error("Error opening edit playlist modal:", err);
    }
}

// Update playlist name
async function updatePlaylist(playlistId, data) {
    try {
        const response = await fetch(`${PLAYLISTS_URL}/${playlistId}?token=${sessionStorage.token}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const resData = await response.json();
        if (response.ok) {
            showNotification(resData.message || "Playlist updated successfully", "success");
            // Refresh playlists
            const resp = await fetch(`${PLAYLISTS_URL}?token=${sessionStorage.token}`);
            if (resp.ok) {
                const d = await resp.json();
                if (d.success) displayPlaylists(d.playlists);
            }
            return true;
        } else {
            showNotification(resData.message || "Failed to update playlist", "error");
            return false;
        }
    } catch (err) {
        console.error("Error updating playlist:", err);
        showNotification("Error updating playlist", "error");
        return false;
    }
}

// Add a track to liked songs
// Debug-enhanced Add to Liked Songs
async function addToLikedSongs(trackId) {
    console.log("=== addToLikedSongs called ===");
    console.log("Track ID:", trackId);
    console.log("Token:", sessionStorage.token);

    if (!trackId) {
        console.warn("Track ID is missing! Aborting add.");
        showNotification("Track ID missing!", "error");
        return;
    }

    if (!sessionStorage.token) {
        console.warn("No token found! User might be logged out.");
        showNotification("You must be logged in to like songs!", "error");
        return;
    }

    try {
        const url = `${LIKED_SONGS_URL}?token=${sessionStorage.token}`;
        console.log("POST URL:", url);
        console.log("Payload:", { spotifyTrackId: trackId });

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spotifyTrackId: trackId })
        });

        const data = await response.json();

        console.log("Response OK:", response.ok);
        console.log("Response JSON:", data);

        if (response.ok && data.success) {
            showNotification(data.message || "Added to Liked Songs", 'success');
            loadLikedSongsCount();
        } else {
            console.warn("Failed to add track. Backend response indicates failure.");
            showNotification(data.message || "Failed to add to Liked Songs", 'error');
        }

    } catch (error) {
        console.error("Error adding track to Liked Songs:", error);
        showNotification("Error adding to Liked Songs", 'error');
    }
}

// Display playlists in UI
function displayPlaylists(playlists) {
    const container = $("#user-playlists-container");

    // Clear existing playlists except the liked songs card
    container.find(".playlist-card").remove();

    if (playlists.length === 0) { appendCreatePlaylistCard(); return; };

    playlists.forEach(function (playlist) {
        let image = playlist.playlistpicture;
        if (!image && playlist.tracks && playlist.tracks.length > 0) {
            image = playlist.tracks[0].albumImage;
        }
        image = image || "./assets/default-album.png";

        const card = $(`
            <div class="card playlist-card position-relative" style="width: 200px;">
                <a href="playlist.html?id=${playlist._id}">
                    <div class="card-image" style="background-image: url('${image}'); background-size: cover; background-position: center;"></div>
                    <div class="card-info">
                        <p class="card-title">${playlist.name}</p>
                        <p class="card-subtitle">${playlist.tracks ? playlist.tracks.length : 0} Tracks</p>
                    </div>
                </a>
                <div class="playlist-actions-bottom">
    <button class="btn btn-sm btn-playlist-action btn-edit-playlist" title="Edit Playlist">
        <i class="fa fa-edit"></i>
    </button>
    <button class="btn btn-sm btn-playlist-action btn-delete-playlist" title="Delete Playlist">
        <i class="fa fa-trash"></i>
    </button>
</div>
            </div>
        `);

        // Edit playlist click
        card.find(".btn-edit-playlist").on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            openEditPlaylistModalById(playlist._id);
        });

        // Delete playlist click
        card.find(".btn-delete-playlist").on("click", async function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
                await deletePlaylist(playlist._id);
            }
        });

        container.append(card);
    });
    appendCreatePlaylistCard();
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
                // Refresh the page after creating the playlist
                location.reload();
            }
        });
    }
    modal.css("display", "flex");
}

// Create a new playlist
async function createPlaylist(name) {
    try {
        const response = await fetch(
            `/playlists/create?token=${sessionStorage.token}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            }
        );

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

function appendCreatePlaylistCard() {
    const container = $('#user-playlists-container');

    const createCard = `
        <div class="card create-playlist-card" style="width: 200px; cursor: pointer;" id="create-playlist-card">
            <div class="card-image"
                style="display: flex; justify-content: center; align-items: center; font-size: 3rem;">
                <i class="fas fa-plus"></i>
            </div>
            <div class="card-info" style="text-align: center;">
                <p class="card-title">Create Playlist</p>
            </div>
        </div>
    `;

    container.append(createCard);
}

async function loadLikedSongsCount() {
    try {
        const response = await fetch(
            `${LIKED_SONGS_URL}?token=${sessionStorage.token}`
        );

        if (!response.ok) throw new Error("Failed to fetch liked songs");

        const data = await response.json();

        const count =
            data.likedSongs?.length ??
            data.tracks?.length ??
            data.results?.length ??
            0;

        $("#liked-songs-count").text(`${count} Tracks`);
    } catch (error) {
        console.error("Error loading liked songs count:", error);
        $("#liked-songs-count").text("0 Tracks");
    }
}
