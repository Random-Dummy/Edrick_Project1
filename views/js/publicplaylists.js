$(async function () {
    let currentPage = 1;
    let isLoading = false;
    let hasMore = true;
    let currentSort = 'newest';
    let currentSearch = '';
    
    // Check authentication
    const token = sessionStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load initial playlists
    await loadPublicPlaylists();
    
    // Search functionality
    $('#search-public').on('input', function () {
        currentSearch = $(this).val().trim();
        currentPage = 1;
        $('#public-playlists-container').empty();
        loadPublicPlaylists();
    });
    
    // Sort buttons
    $('#sort-newest').on('click', function () {
        if (currentSort === 'newest') return;
        currentSort = 'newest';
        updateSortButtons();
        currentPage = 1;
        $('#public-playlists-container').empty();
        loadPublicPlaylists();
    });
    
    $('#sort-popular').on('click', function () {
        if (currentSort === 'popular') return;
        currentSort = 'popular';
        updateSortButtons();
        currentPage = 1;
        $('#public-playlists-container').empty();
        loadPublicPlaylists();
    });
    
    $('#sort-cloned').on('click', function () {
        if (currentSort === 'cloned') return;
        currentSort = 'cloned';
        updateSortButtons();
        currentPage = 1;
        $('#public-playlists-container').empty();
        loadPublicPlaylists();
    });
    
    // Load more button
    $('#load-more-btn').on('click', function () {
        if (!isLoading && hasMore) {
            currentPage++;
            loadPublicPlaylists();
        }
    });
    
    // Close clone modal
    $('#close-clone-modal, #cancel-clone').on('click', function () {
        $('#clone-modal').hide();
    });
    
    // Clone form submission
    $('#clone-form').on('submit', async function (e) {
        e.preventDefault();
        const playlistId = $(this).data('playlist-id');
        const playlistName = $(this).data('original-name');
        const newName = $('#clone-name').val().trim() || `${playlistName} (Copy)`;
        
        await clonePlaylist(playlistId, newName);
    });
    
    // Click outside to close modal
    $('#clone-modal').on('click', function (e) {
        if (e.target === this) {
            $(this).hide();
        }
    });
    
    function updateSortButtons() {
        $('#sort-newest, #sort-popular, #sort-cloned').removeClass('btn-primary').addClass('btn-secondary');
        $(`#sort-${currentSort}`).removeClass('btn-secondary').addClass('btn-primary');
    }
    
    async function loadPublicPlaylists() {
        if (isLoading) return;
        
        isLoading = true;
        $('#loading').show();
        $('#load-more-container').hide();
        
        try {
            // Build URL with pagination and sorting
            let url = `${BASE_URL}/playlists/public?page=${currentPage}&limit=12`;
            
            // Add search parameter if exists
            if (currentSearch) {
                url += `&search=${encodeURIComponent(currentSearch)}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                displayPublicPlaylists(data.playlists);
                
                // Update pagination
                hasMore = currentPage < data.totalPages;
                if (hasMore && data.playlists.length > 0) {
                    $('#load-more-container').show();
                } else {
                    $('#load-more-container').hide();
                }
                
                // Show/hide no playlists message
                if (currentPage === 1 && data.playlists.length === 0) {
                    $('#no-playlists').show();
                } else {
                    $('#no-playlists').hide();
                }
            } else {
                showNotification(data.message || 'Failed to load playlists', 'error');
            }
        } catch (error) {
            console.error('Error loading public playlists:', error);
            showNotification('Error loading public playlists', 'error');
        } finally {
            isLoading = false;
            $('#loading').hide();
        }
    }
    
    function displayPublicPlaylists(playlists) {
        const container = $('#public-playlists-container');
        
        if (currentPage === 1) {
            container.empty();
        }
        
        if (playlists.length === 0 && currentPage === 1) {
            container.html(`
                <div class="text-center" style="grid-column: 1 / -1;">
                    <p style="color: var(--light-gray); font-size: 1.2em;">
                        No public playlists found.${currentSearch ? ' Try a different search.' : ''}
                    </p>
                </div>
            `);
            return;
        }
        
        playlists.forEach(playlist => {
            // Get playlist image (use first track's image or default)
            let image = playlist.playlistpicture;
            if (!image && playlist.tracks && playlist.tracks.length > 0) {
                image = playlist.tracks[0].albumImage;
            }
            image = image || './assets/default-album.png';
            
            // Format creator name
            const creatorName = playlist.creator?.username || 'Unknown User';
            
            // Format track count
            const trackCount = playlist.tracks ? playlist.tracks.length : 0;
            const trackText = trackCount === 1 ? '1 track' : `${trackCount} tracks`;
            
            // Format clone count
            const cloneCount = playlist.cloneCount || 0;
            
            const playlistCard = $(`
                <div class="card public-playlist-card" data-playlist-id="${playlist._id}">
                    <div class="card-image" style="background-image: url('${image}');"></div>
                    <div class="card-info">
                        <p class="card-title">${playlist.name}</p>
                        <p class="card-subtitle">
                            <i class="fas fa-user" style="margin-right: 5px;"></i>${creatorName}
                        </p>
                        <p class="card-subtitle">
                            <i class="fas fa-music" style="margin-right: 5px;"></i>${trackText}
                        </p>
                        ${playlist.cloneCount > 0 ? `
                        <p class="card-subtitle">
                            <i class="fas fa-clone" style="margin-right: 5px;"></i>Cloned ${cloneCount} time${cloneCount !== 1 ? 's' : ''}
                        </p>
                        ` : ''}
                        ${playlist.description ? `
                        <p class="card-subtitle" style="margin-top: 8px; font-size: 0.8em; color: #888;">
                            ${playlist.description.length > 60 ? 
                              playlist.description.substring(0, 60) + '...' : 
                              playlist.description}
                        </p>
                        ` : ''}
                    </div>
                    <div class="card-actions" style="display: flex; justify-content: space-between; padding: 10px 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <button class="btn btn-sm btn-outline-primary view-playlist-btn" 
                                title="View Playlist">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-primary clone-playlist-btn" 
                                title="Clone to Your Library">
                            <i class="fas fa-clone"></i> Clone
                        </button>
                    </div>
                </div>
            `);
            
            // View playlist click
            playlistCard.find('.view-playlist-btn').on('click', function (e) {
                e.stopPropagation();
                window.location.href = `playlist.html?id=${playlist._id}&view=public`;
            });
            
            // Clone playlist click
            playlistCard.find('.clone-playlist-btn').on('click', function (e) {
                e.stopPropagation();
                openCloneModal(playlist._id, playlist.name);
            });
            
            // Click on card (view playlist)
            playlistCard.on('click', function (e) {
                if (!$(e.target).closest('.btn').length) {
                    window.location.href = `playlist.html?id=${playlist._id}&view=public`;
                }
            });
            
            container.append(playlistCard);
        });
    }
    
    function openCloneModal(playlistId, playlistName) {
        $('#clone-name').val(`${playlistName} (Copy)`);
        $('#clone-form')
            .data('playlist-id', playlistId)
            .data('original-name', playlistName);
        $('#clone-modal').show();
        $('#clone-name').focus();
    }
    
    async function clonePlaylist(playlistId, newName) {
        try {
            const response = await fetch(
                `${BASE_URL}/playlists/${playlistId}/clone?token=${sessionStorage.token}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ newName })
                }
            );
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                $('#clone-modal').hide();
                showNotification('Playlist cloned successfully! You can find it in your playlists.', 'success');
                
                // Refresh the list to update clone count
                currentPage = 1;
                $('#public-playlists-container').empty();
                await loadPublicPlaylists();
            } else {
                showNotification(data.message || 'Failed to clone playlist', 'error');
            }
        } catch (error) {
            console.error('Error cloning playlist:', error);
            showNotification('Error cloning playlist', 'error');
        }
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
});