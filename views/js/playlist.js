// playlist.js - Main jQuery file for playlist functionality
$(document).ready(function() {
    // Global variables
    let userToken = null;
    let currentUser = null;
    let playlists = [];
    let currentPlaylistId = null;
    let currentTracks = [];
    let allTracks = []; // Store all tracks for searching

    // Initialize the application
    function initApp() {
        // Check if user is logged in (token in URL or localStorage)
        const urlParams = new URLSearchParams(window.location.search);
        userToken = urlParams.get('token') || localStorage.getItem('userToken');
        
        if (!userToken) {
            // Redirect to login if no token
            window.location.href = 'login.html';
            return;
        }
        
        // Store token for future use
        localStorage.setItem('userToken', userToken);
        
        // Remove token from URL if present
        if (urlParams.has('token')) {
            urlParams.delete('token');
            const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
            window.history.replaceState({}, '', newUrl);
        }
        
        // Load user data and playlists
        loadUserData();
        loadPlaylists();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initialize Spotify player iframe
        initSpotifyPlayer();
    }

    // Load user data
    function loadUserData() {
        $.ajax({
            url: '/api/user/profile', // You'll need to add this endpoint
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userToken}`
            },
            success: function(response) {
                currentUser = response.user;
                updateUserUI();
            },
            error: function(xhr, status, error) {
                console.error('Error loading user data:', error);
                // Fallback: Show username from localStorage
                const storedUsername = localStorage.getItem('username');
                if (storedUsername) {
                    $('.user-name').text(storedUsername);
                }
            }
        });
    }

    // Update user UI elements
    function updateUserUI() {
        if (currentUser && currentUser.username) {
            $('.user-name').text(currentUser.username);
            localStorage.setItem('username', currentUser.username);
        }
    }

    // Load user's playlists
    function loadPlaylists() {
        $.ajax({
            url: '/api/playlists',
            method: 'GET',
            data: { token: userToken },
            success: function(response) {
                playlists = response.playlists || [];
                updatePlaylistsSidebar();
                
                // If there are playlists, load the first one
                if (playlists.length > 0 && !currentPlaylistId) {
                    loadPlaylistDetails(playlists[0]._id);
                } else if (playlists.length === 0) {
                    // No playlists, show empty state
                    showEmptyPlaylistState();
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading playlists:', error);
                showNotification('Error loading playlists', 'error');
            }
        });
    }

    // Update playlists in sidebar
    function updatePlaylistsSidebar() {
        const $playlistList = $('.playlists');
        
        // Clear existing playlists (except Liked Songs and Create Playlist)
        $playlistList.find('.playlist-item:not(.create-playlist, .liked-songs)').remove();
        
        // Add user's playlists
        playlists.forEach(function(playlist, index) {
            const isActive = playlist._id === currentPlaylistId;
            const playlistItem = `
                <li class="playlist-item ${isActive ? 'active' : ''}" data-playlist-id="${playlist._id}">
                    <i class="fas fa-list"></i>
                    <span class="playlist-name">${escapeHtml(playlist.name)}</span>
                    <span class="track-count">(${playlist.tracks ? playlist.tracks.length : 0})</span>
                    <button class="playlist-delete-btn" data-playlist-id="${playlist._id}" title="Delete playlist">
                        <i class="fas fa-times"></i>
                    </button>
                </li>
            `;
            
            // Insert before the user section
            $(playlistItem).insertAfter($playlistList.find('.liked-songs'));
        });
        
        // Update playlist count
        updatePlaylistCount();
    }

    // Load playlist details and tracks
    function loadPlaylistDetails(playlistId) {
        currentPlaylistId = playlistId;
        
        // Update active state in sidebar
        $('.playlist-item').removeClass('active');
        $(`.playlist-item[data-playlist-id="${playlistId}"]`).addClass('active');
        
        // Show loading state
        $('.songs-table .table-row, .search-header, .no-tracks').remove();
        $('.songs-table').append('<div class="loading">Loading tracks...</div>');
        
        // Clear search input
        $('#search-input').val('');
        
        // Find the playlist data
        const playlist = playlists.find(p => p._id === playlistId);
        if (playlist) {
            updatePlaylistHeader(playlist);
            loadPlaylistTracks(playlistId);
        }
    }

    // Update playlist header
    function updatePlaylistHeader(playlist) {
        $('.playlist-title').text(playlist.name);
        
        // Update playlist cover image
        if (playlist.picture) {
            $('.playlist-cover img').attr('src', playlist.picture);
        } else {
            // Set default image based on playlist name or track count
            const defaultImage = playlist.tracks && playlist.tracks.length > 0 
                ? 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
                : 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
            $('.playlist-cover img').attr('src', defaultImage);
        }
        
        // Update owner info
        if (currentUser && playlist.creator === currentUser._id) {
            $('.playlist-owner').html(`<i class="fas fa-user"></i> ${escapeHtml(currentUser.username)}`);
        }
        
        // Update track count in header
        const trackCount = playlist.tracks ? playlist.tracks.length : 0;
        $('.playlist-stats .track-count').remove();
        $('.playlist-stats').append(`<span class="track-count">• ${trackCount} songs</span>`);
    }

    // Load tracks for a playlist
    function loadPlaylistTracks(playlistId) {
        // Try to get tracks from loaded playlist data first
        const playlist = playlists.find(p => p._id === playlistId);
        if (playlist && playlist.tracks) {
            allTracks = playlist.tracks;
            currentTracks = [...allTracks]; // Copy for filtering
            renderTracksTable(currentTracks);
            return;
        }
        
        // If tracks not in playlist data, fetch from API
        $.ajax({
            url: `/api/playlists/${playlistId}`,
            method: 'GET',
            data: { token: userToken },
            success: function(response) {
                // Update playlist data with tracks
                const playlistIndex = playlists.findIndex(p => p._id === playlistId);
                if (playlistIndex !== -1) {
                    playlists[playlistIndex].tracks = response.playlist.tracks || [];
                    allTracks = playlists[playlistIndex].tracks;
                    currentTracks = [...allTracks];
                    
                    // Update track count in sidebar
                    $(`.playlist-item[data-playlist-id="${playlistId}"] .track-count`)
                        .text(`(${allTracks.length})`);
                    
                    renderTracksTable(currentTracks);
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading playlist tracks:', error);
                $('.songs-table .loading').remove();
                $('.songs-table').append('<div class="error">Error loading tracks</div>');
            }
        });
    }

    // Render tracks in the table
    function renderTracksTable(tracks) {
        const $table = $('.songs-table');
        
        // Clear existing rows and loading/error messages
        $table.find('.table-row, .loading, .error, .no-tracks, .search-header').remove();
        
        if (tracks.length === 0 && $('#search-input').val().trim() === '') {
            $table.append('<div class="no-tracks">No tracks in this playlist yet</div>');
            return;
        } else if (tracks.length === 0) {
            $table.append('<div class="no-tracks">No tracks match your search</div>');
            return;
        }
        
        tracks.forEach(function(track, index) {
            const trackRow = `
                <div class="table-row" data-track-id="${track.spotifyTrackId}" 
                     data-track-name="${escapeHtml(track.name.toLowerCase())}"
                     data-track-artist="${escapeHtml(track.artist.toLowerCase())}"
                     data-track-album="${escapeHtml(track.album.toLowerCase())}">
                    <div class="cell index">${index + 1}</div>
                    <div class="cell song-info">
                        <img src="${track.albumImage || 'https://via.placeholder.com/40'}" 
                             alt="${escapeHtml(track.name)}" 
                             onerror="this.src='https://via.placeholder.com/40'">
                        <div class="song-details">
                            <div class="song-title">${escapeHtml(track.name)}</div>
                            <div class="song-artist">${escapeHtml(track.artist)}</div>
                        </div>
                    </div>
                    <div class="cell album">${escapeHtml(track.album)}</div>
                    <div class="cell duration">${formatDuration(track.durationMs)}</div>
                    <div class="cell actions">
                        <button class="play-track-btn" data-track-id="${track.spotifyTrackId}" title="Play">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="remove-track-btn" data-track-id="${track.spotifyTrackId}" title="Remove from playlist">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
            $table.append(trackRow);
        });
    }

    // Search for songs within the current playlist
    function searchSongsInPlaylist(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (searchTerm === '') {
            // If search is empty, show all tracks
            currentTracks = [...allTracks];
            renderTracksTable(currentTracks);
            return;
        }
        
        // Filter tracks based on search term
        const filteredTracks = allTracks.filter(function(track) {
            const trackName = track.name.toLowerCase();
            const artistName = track.artist.toLowerCase();
            const albumName = track.album.toLowerCase();
            
            // Search in name, artist, and album
            return trackName.includes(searchTerm) || 
                   artistName.includes(searchTerm) || 
                   albumName.includes(searchTerm);
        });
        
        currentTracks = filteredTracks;
        renderTracksTable(currentTracks);
        
        // Show search results header
        if (searchTerm !== '') {
            const $table = $('.songs-table');
            $table.find('.search-header').remove();
            $table.prepend(`
                <div class="search-header">
                    Search results for "${escapeHtml(query)}" (${filteredTracks.length} of ${allTracks.length} tracks)
                    <button class="clear-search-btn">Clear</button>
                </div>
            `);
            
            // Add clear search button event
            $table.find('.clear-search-btn').on('click', function() {
                $('#search-input').val('');
                searchSongsInPlaylist('');
            });
        }
    }

    // Add a new track to the playlist (from external search - optional feature)
    function addTrackToPlaylist(trackData) {
        if (!currentPlaylistId) {
            showNotification('Please select a playlist first', 'warning');
            return false;
        }
        
        $.ajax({
            url: `/api/playlists/${currentPlaylistId}/tracks`,
            method: 'POST',
            data: {
                token: userToken,
                ...trackData
            },
            success: function(response) {
                showNotification('Track added to playlist', 'success');
                
                // Update local playlist data
                const playlistIndex = playlists.findIndex(p => p._id === currentPlaylistId);
                if (playlistIndex !== -1) {
                    if (!playlists[playlistIndex].tracks) {
                        playlists[playlistIndex].tracks = [];
                    }
                    playlists[playlistIndex].tracks.push(trackData);
                    allTracks.push(trackData);
                    currentTracks.push(trackData);
                    
                    // Update UI
                    renderTracksTable(currentTracks);
                    
                    // Update track count in sidebar
                    $(`.playlist-item[data-playlist-id="${currentPlaylistId}"] .track-count`)
                        .text(`(${allTracks.length})`);
                        
                    // Update header track count
                    $('.playlist-stats .track-count').remove();
                    $('.playlist-stats').append(`<span class="track-count">• ${allTracks.length} songs</span>`);
                }
                return true;
            },
            error: function(xhr, status, error) {
                console.error('Error adding track:', error);
                const errorMsg = xhr.responseJSON?.message || 'Error adding track';
                showNotification(errorMsg, 'error');
                return false;
            }
        });
    }

    // Remove track from playlist
    function removeTrackFromPlaylist(trackId) {
        if (!currentPlaylistId) {
            showNotification('No playlist selected', 'warning');
            return;
        }
        
        if (!confirm('Are you sure you want to remove this track from the playlist?')) {
            return;
        }
        
        $.ajax({
            url: `/api/playlists/${currentPlaylistId}/tracks/${trackId}`,
            method: 'DELETE',
            data: { token: userToken },
            success: function(response) {
                showNotification('Track removed from playlist', 'success');
                
                // Update local playlist data
                const playlistIndex = playlists.findIndex(p => p._id === currentPlaylistId);
                if (playlistIndex !== -1) {
                    const trackIndex = playlists[playlistIndex].tracks.findIndex(t => t.spotifyTrackId === trackId);
                    if (trackIndex !== -1) {
                        playlists[playlistIndex].tracks.splice(trackIndex, 1);
                        allTracks = playlists[playlistIndex].tracks;
                        
                        // Update current tracks (consider search filter)
                        const searchTerm = $('#search-input').val().toLowerCase().trim();
                        if (searchTerm === '') {
                            currentTracks = [...allTracks];
                        } else {
                            currentTracks = allTracks.filter(function(track) {
                                const trackName = track.name.toLowerCase();
                                const artistName = track.artist.toLowerCase();
                                const albumName = track.album.toLowerCase();
                                return trackName.includes(searchTerm) || 
                                       artistName.includes(searchTerm) || 
                                       albumName.includes(searchTerm);
                            });
                        }
                        
                        // Update UI
                        renderTracksTable(currentTracks);
                        
                        // Update track count in sidebar
                        $(`.playlist-item[data-playlist-id="${currentPlaylistId}"] .track-count`)
                            .text(`(${allTracks.length})`);
                            
                        // Update header track count
                        $('.playlist-stats .track-count').remove();
                        $('.playlist-stats').append(`<span class="track-count">• ${allTracks.length} songs</span>`);
                    }
                }
            },
            error: function(xhr, status, error) {
                console.error('Error removing track:', error);
                showNotification('Error removing track', 'error');
            }
        });
    }

    // Create new playlist
    function createNewPlaylist(name) {
        $.ajax({
            url: '/api/playlists/create',
            method: 'POST',
            data: {
                token: userToken,
                name: name
            },
            success: function(response) {
                showNotification('Playlist created successfully', 'success');
                // Reload playlists to get the new playlist with ID
                loadPlaylists();
            },
            error: function(xhr, status, error) {
                console.error('Error creating playlist:', error);
                const errorMsg = xhr.responseJSON?.message || 'Error creating playlist';
                showNotification(errorMsg, 'error');
            }
        });
    }

    // Delete playlist
    function deletePlaylist(playlistId) {
        if (!confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
            return;
        }
        
        $.ajax({
            url: `/api/playlists/${playlistId}`,
            method: 'DELETE',
            data: { token: userToken },
            success: function(response) {
                showNotification('Playlist deleted successfully', 'success');
                
                // Remove from local data
                const playlistIndex = playlists.findIndex(p => p._id === playlistId);
                if (playlistIndex !== -1) {
                    playlists.splice(playlistIndex, 1);
                }
                
                // Update sidebar
                updatePlaylistsSidebar();
                
                // If we deleted the current playlist, clear the view
                if (playlistId === currentPlaylistId) {
                    currentPlaylistId = null;
                    currentTracks = [];
                    allTracks = [];
                    $('.playlist-title').text('Select a Playlist');
                    $('.playlist-cover img').attr('src', 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80');
                    $('.playlist-owner').html('<i class="fas fa-user"></i> Select a playlist');
                    $('.playlist-stats .track-count').remove();
                    $('.songs-table').find('.table-row, .no-tracks, .search-header').remove();
                    $('.songs-table').append('<div class="no-tracks">Select a playlist to view tracks</div>');
                    $('#search-input').val('');
                }
                
                // If no playlists left, show empty state
                if (playlists.length === 0) {
                    showEmptyPlaylistState();
                }
            },
            error: function(xhr, status, error) {
                console.error('Error deleting playlist:', error);
                showNotification('Error deleting playlist', 'error');
            }
        });
    }

    // Show empty playlist state
    function showEmptyPlaylistState() {
        $('.playlist-title').text('No Playlists');
        $('.playlist-cover img').attr('src', 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80');
        $('.playlist-owner').html('<i class="fas fa-user"></i> Create your first playlist');
        $('.playlist-stats .track-count').remove();
        $('.songs-table').find('.table-row, .no-tracks, .search-header').remove();
        $('.songs-table').append(`
            <div class="no-tracks">
                <p>You don't have any playlists yet.</p>
                <button class="create-first-playlist-btn">Create your first playlist</button>
            </div>
        `);
        
        // Add event listener for create first playlist button
        $('.create-first-playlist-btn').on('click', function() {
            const playlistName = prompt('Enter playlist name:');
            if (playlistName && playlistName.trim()) {
                createNewPlaylist(playlistName.trim());
            }
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Create playlist button
        $('.playlists').on('click', '.create-playlist', function(e) {
            e.stopPropagation();
            const playlistName = prompt('Enter playlist name:');
            if (playlistName && playlistName.trim()) {
                createNewPlaylist(playlistName.trim());
            }
        });
        
        // Liked songs button
        $('.playlists').on('click', '.liked-songs', function() {
            loadLikedSongs();
        });
        
        // Playlist click
        $('.playlists').on('click', '.playlist-item:not(.create-playlist, .liked-songs)', function() {
            const playlistId = $(this).data('playlist-id');
            loadPlaylistDetails(playlistId);
        });
        
        // Delete playlist button
        $('.playlists').on('click', '.playlist-delete-btn', function(e) {
            e.stopPropagation();
            const playlistId = $(this).data('playlist-id');
            deletePlaylist(playlistId);
        });
        
        // Remove track button
        $(document).on('click', '.remove-track-btn', function() {
            const trackId = $(this).data('track-id');
            removeTrackFromPlaylist(trackId);
        });
        
        // Play track button
        $(document).on('click', '.play-track-btn', function() {
            const trackId = $(this).data('track-id');
            playTrack(trackId);
        });
        
        // Search functionality - search within playlist
        $('#search-input').on('input', debounce(function(e) {
            const query = $(this).val();
            searchSongsInPlaylist(query);
        }, 300));
        
        // Clear search button
        $('.search-clear-btn').on('click', function() {
            $('#search-input').val('');
            searchSongsInPlaylist('');
        });
        
        // Lyrics toggle
        $('#lyrics-toggle-btn').on('click', function() {
            toggleLyrics();
        });
        
        // Logout
        $('.logout-btn').on('click', function() {
            logoutUser();
        });
    }

    // Initialize Spotify player
    function initSpotifyPlayer() {
        window.onSpotifyIframeApiReady = function(IFrameAPI) {
            const element = document.getElementById('spotify-player-container');
            const options = {
                uri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqT',
                width: '100%',
                height: '80'
            };
            const callback = (EmbedController) => {
                window.player = EmbedController;
            };
            IFrameAPI.createController(element, options, callback);
        };
    }

    // Play a track in Spotify player
    function playTrack(trackId) {
        if (window.player) {
            window.player.loadUri(`spotify:track:${trackId}`);
        } else {
            // Fallback: Open in new tab
            window.open(`https://open.spotify.com/track/${trackId}`, '_blank');
        }
    }

    // Toggle lyrics display
    function toggleLyrics() {
        // This would need integration with your lyrics API
        showNotification('Lyrics feature coming soon!', 'info');
    }

    // Load liked songs
    function loadLikedSongs() {
        $.ajax({
            url: '/api/liked-songs/with-lyrics',
            method: 'GET',
            data: { token: userToken },
            success: function(response) {
                if (response.success && response.tracks.length > 0) {
                    // Update UI for liked songs
                    allTracks = response.tracks;
                    currentTracks = [...allTracks];
                    
                    $('.playlist-title').text('Liked Songs');
                    $('.playlist-cover img').attr('src', 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80');
                    $('.playlist-owner').html('<i class="fas fa-heart"></i> Your Liked Songs');
                    $('.playlist-stats .track-count').remove();
                    $('.playlist-stats').append(`<span class="track-count">• ${allTracks.length} songs</span>`);
                    
                    renderTracksTable(currentTracks);
                } else {
                    showNotification('No liked songs found', 'info');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading liked songs:', error);
                showNotification('Error loading liked songs', 'error');
            }
        });
    }

    // Logout user
    function logoutUser() {
        $.ajax({
            url: '/api/user/logout',
            method: 'GET',
            data: { token: userToken },
            success: function() {
                localStorage.removeItem('userToken');
                localStorage.removeItem('username');
                window.location.href = 'login.html';
            },
            error: function() {
                // Still clear local storage and redirect
                localStorage.removeItem('userToken');
                localStorage.removeItem('username');
                window.location.href = 'login.html';
            }
        });
    }

    // Utility functions
    function formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function showNotification(message, type = 'info') {
        // Remove existing notifications
        $('.notification').remove();
        
        const notification = $(`
            <div class="notification notification-${type}">
                ${message}
                <button class="notification-close">&times;</button>
            </div>
        `);
        
        $('body').append(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.fadeOut(300, () => notification.remove());
        }, 5000);
        
        // Close button
        notification.find('.notification-close').on('click', function() {
            notification.fadeOut(300, () => notification.remove());
        });
    }

    function updatePlaylistCount() {
        const count = playlists.length;
        $('.playlists-section h3').text(`PLAYLISTS (${count})`);
    }

    // Initialize the app
    initApp();
});