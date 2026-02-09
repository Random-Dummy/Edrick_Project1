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

    // Initialize sort buttons
    updateSortButtons();
    
    // Load initial playlists
    await loadPublicPlaylists();

    // Search functionality with debounce
    let searchTimeout;
    $('#search-public').on('input', function () {
        const searchValue = $(this).val().trim();
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        // Set new timeout for debounce (500ms)
        searchTimeout = setTimeout(() => {
            if (currentSearch !== searchValue) {
                currentSearch = searchValue;
                currentPage = 1;
                $('#public-playlists-container').empty();
                loadPublicPlaylists();
            }
        }, 500);
    });

    // Clear search button
    $('#clear-search').on('click', function() {
        $('#search-public').val('');
        currentSearch = '';
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

    // Add keypress event for Enter in search
    $('#search-public').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            e.preventDefault();
            $(this).trigger('input');
        }
    });

    function updateSortButtons() {
        $('#sort-newest, #sort-cloned')
            .removeClass('btn-primary btn-secondary')
            .addClass('btn-secondary');
        
        $(`#sort-${currentSort}`)
            .removeClass('btn-secondary')
            .addClass('btn-primary');
        
        // Update active sort indicator
        $('.sort-active').removeClass('sort-active');
        $(`#sort-${currentSort}`).addClass('sort-active');
    }

    async function loadPublicPlaylists() {
        if (isLoading) return;

        isLoading = true;
        $('#loading').show();
        $('#load-more-container').hide();

        try {
            // Build URL with pagination, sorting, and search
            let url = `${BASE_URL}/playlists/public?page=${currentPage}&limit=12&sort=${currentSort}`;
            
            // Add search parameter if exists
            if (currentSearch) {
                url += `&search=${encodeURIComponent(currentSearch)}`;
            }

            console.log('Loading playlists from:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Playlists data received:', data);

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
                    if (currentSearch) {
                        $('#no-playlists').html(`
                            <p style="color: var(--light-gray); font-size: 1.2em;">
                                No public playlists found for "${currentSearch}". Try a different search.
                            </p>
                            <button id="clear-search-results" class="btn btn-primary mt-3">
                                Clear Search
                            </button>
                        `);
                        
                        $('#clear-search-results').on('click', function() {
                            $('#search-public').val('');
                            currentSearch = '';
                            currentPage = 1;
                            $('#public-playlists-container').empty();
                            loadPublicPlaylists();
                        });
                    }
                } else {
                    $('#no-playlists').hide();
                }
            } else {
                showNotification(data.message || 'Failed to load playlists', 'error');
            }
        } catch (error) {
            console.error('Error loading public playlists:', error);
            showNotification('Error loading public playlists', 'error');
            $('#no-playlists').show().html(`
                <p style="color: var(--error); font-size: 1.2em;">
                    Error loading playlists. Please try again.
                </p>
            `);
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
                        ${currentSearch 
                            ? `No public playlists found for "${currentSearch}"` 
                            : 'No public playlists found.'}
                    </p>
                    ${currentSearch ? `
                        <button id="clear-search-display" class="btn btn-primary mt-3">
                            Clear Search
                        </button>
                    ` : ''}
                </div>
            `);
            
            if (currentSearch) {
                $('#clear-search-display').on('click', function() {
                    $('#search-public').val('');
                    currentSearch = '';
                    currentPage = 1;
                    container.empty();
                    loadPublicPlaylists();
                });
            }
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

            // Format clone count - IMPORTANT for "Most Cloned" sort
            const cloneCount = playlist.cloneCount || 0;

            // Get playlist description (truncate if too long)
            let description = playlist.description || '';
            if (description.length > 100) {
                description = description.substring(0, 100) + '...';
            }

            // Highlight search term if present
            let highlightedName = playlist.name;
            let highlightedCreator = creatorName;
            
            if (currentSearch) {
                const searchRegex = new RegExp(`(${currentSearch})`, 'gi');
                highlightedName = playlist.name.replace(searchRegex, '<span class="search-highlight">$1</span>');
                highlightedCreator = creatorName.replace(searchRegex, '<span class="search-highlight">$1</span>');
            }

            const playlistCard = $(`
                <div class="card public-playlist-card" data-playlist-id="${playlist._id}" style="position: relative;">
                    <div class="card-image" style="background-image: url('${image}'); position: relative;">
                        <!-- Floating "+" button on image -->
                        <button class="clone-playlist-btn floating-plus-btn" 
                                title="Clone to Your Library"
                                style="position: absolute; bottom: 10px; right: 10px; width: 40px; height: 40px; border-radius: 50%; background-color: var(--primary-color); border: none; color: white; cursor: pointer; opacity: 0; transition: opacity 0.3s; z-index: 2;">
                            <i class="fas fa-plus"></i>
                        </button>
                        <!-- Overlay on hover -->
                        <div class="image-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); opacity: 0; transition: opacity 0.3s;"></div>
                    </div>
                    <div class="card-info">
                        <p class="card-title">${highlightedName}</p>
                        <p class="card-subtitle">
                            <i class="fas fa-user" style="margin-right: 5px;"></i>${highlightedCreator}
                        </p>
                        <p class="card-subtitle">
                            <i class="fas fa-music" style="margin-right: 5px;"></i>${trackText}
                        </p>
                        ${cloneCount > 0 ? `
                        <p class="card-subtitle">
                            <i class="fas fa-clone" style="margin-right: 5px;"></i>Cloned ${cloneCount} time${cloneCount !== 1 ? 's' : ''}
                        </p>
                        ` : ''}
                        ${description ? `
                        <p class="card-subtitle" style="margin-top: 8px; font-size: 0.8em; color: #888;">
                            ${description}
                        </p>
                        ` : ''}
                        <!-- Debug info - shows sort values -->
                        <p class="card-subtitle" style="font-size: 0.7em; color: #666;">
                            <span style="color: ${currentSort === 'newest' ? '#1DB954' : '#888'};">Newest sort</span> | 
                            <span style="color: ${currentSort === 'cloned' ? '#1DB954' : '#888'};">Clones: ${cloneCount}</span>
                        </p>
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

            // Add hover effect to show the "+" button
            playlistCard.hover(
                function () {
                    $(this).find('.floating-plus-btn').css('opacity', '1');
                    $(this).find('.image-overlay').css('opacity', '1');
                },
                function () {
                    $(this).find('.floating-plus-btn').css('opacity', '0');
                    $(this).find('.image-overlay').css('opacity', '0');
                }
            );

            // Both buttons should trigger the same clone action
            playlistCard.find('.floating-plus-btn, .clone-playlist-btn').on('click', function (e) {
                e.stopPropagation();
                openCloneModal(playlist._id, playlist.name);
            });

            // View playlist click
            playlistCard.find('.view-playlist-btn').on('click', function (e) {
                e.stopPropagation();
                window.location.href = `playlist.html?id=${playlist._id}&view=public`;
            });

            // Click on card (view playlist)
            playlistCard.on('click', function (e) {
                if (!$(e.target).closest('.btn').length) {
                    window.location.href = `playlist.html?id=${playlist._id}&view=public`;
                }
            });

            container.append(playlistCard);
        });
        
        // Add fade-in animation for new cards
        if (currentPage === 1) {
            container.find('.public-playlist-card').hide().each(function(index) {
                $(this).delay(index * 100).fadeIn(300);
            });
        } else {
            container.find('.public-playlist-card:last-child').hide().fadeIn(300);
        }
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