const lyrics = require('../models/lyrics.js');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const lyricsService = {
    /**
     * Get lyrics for a track from Spotify ID
     * @param {string} spotifyTrackId - Spotify track ID
     * @param {string} songName - Song name (optional, for fallback)
     * @param {string} artist - Artist name (optional, for fallback)
     * @returns {Promise<object>} Lyrics data
     */
    async getLyrics(spotifyTrackId, songName = null, artist = null) {
        try {
            // First, check if we already have lyrics in database
            const cachedLyrics = await this.getCachedLyrics(spotifyTrackId);
            if (cachedLyrics) {
                return {
                    success: true,
                    source: 'cache',
                    lyrics: cachedLyrics,
                    spotifyTrackId: spotifyTrackId
                };
            }

            // If we don't have cached lyrics, fetch from Genius
            const geniusLyrics = await this.fetchFromGenius(spotifyTrackId, songName, artist);
            
            if (geniusLyrics) {
                // Cache the lyrics for future use
                await this.cacheLyrics(spotifyTrackId, geniusLyrics.songName, geniusLyrics.artist, geniusLyrics.lyrics);
                
                return {
                    success: true,
                    source: 'genius',
                    ...geniusLyrics
                };
            }

            // If Genius fails, try fallback sources
            const fallbackLyrics = await this.fetchFromFallbackSources(songName, artist);
            if (fallbackLyrics) {
                // Cache the fallback lyrics too
                await this.cacheLyrics(spotifyTrackId, fallbackLyrics.songName, fallbackLyrics.artist, fallbackLyrics.lyrics);
                
                return {
                    success: true,
                    source: 'fallback',
                    ...fallbackLyrics
                };
            }

            return {
                success: false,
                message: 'Lyrics not found from any source',
                spotifyTrackId: spotifyTrackId
            };

        } catch (error) {
            console.error('Error in getLyrics:', error.message);
            return {
                success: false,
                message: 'Failed to get lyrics',
                error: error.message,
                spotifyTrackId: spotifyTrackId
            };
        }
    },

    /**
     * Get cached lyrics from database
     * @param {string} spotifyTrackId - Spotify track ID
     * @returns {Promise<string|null>} Cached lyrics or null
     */
    async getCachedLyrics(spotifyTrackId) {
        try {
            const cached = await lyrics.findOne({ spotifyTrackId: spotifyTrackId });
            return cached ? cached.lyrics : null;
        } catch (error) {
            console.error('Error getting cached lyrics:', error.message);
            return null;
        }
    },

    /**
     * Cache lyrics in database
     * @param {string} spotifyTrackId - Spotify track ID
     * @param {string} songName - Song name
     * @param {string} artist - Artist name
     * @param {string} lyricsText - Lyrics text
     */
    async cacheLyrics(spotifyTrackId, songName, artist, lyricsText) {
        try {
            // Check if already exists
            const existing = await lyrics.findOne({ spotifyTrackId: spotifyTrackId });
            
            if (existing) {
                // Update existing record
                existing.lyrics = lyricsText;
                await existing.save();
            } else {
                // Create new record
                await lyrics.create({
                    spotifyTrackId: spotifyTrackId,
                    songName: songName,
                    artist: artist,
                    lyrics: lyricsText
                });
            }
        } catch (error) {
            console.error('Error caching lyrics:', error.message);
            // Don't throw error, caching failure shouldn't break the flow
        }
    },

    /**
     * Fetch lyrics from Genius API
     * @param {string} spotifyTrackId - Spotify track ID
     * @param {string} songName - Song name
     * @param {string} artist - Artist name
     * @returns {Promise<object|null>} Lyrics data or null
     */
    async fetchFromGenius(spotifyTrackId, songName = null, artist = null) {
        // If songName and artist aren't provided, we can't search Genius
        if (!songName || !artist) {
            return null;
        }

        try {
            // Step 1: Search Genius for the song
            const searchResult = await this.searchGenius(songName, artist);
            
            if (!searchResult || !searchResult.id) {
                return null;
            }

            // Step 2: Get lyrics from Genius page
            const geniusUrl = searchResult.url;
            const lyricsText = await this.scrapeGeniusLyrics(geniusUrl);
            
            if (!lyricsText || lyricsText.trim().length < 50) {
                return null;
            }

            return {
                spotifyTrackId: spotifyTrackId,
                songName: searchResult.title || songName,
                artist: searchResult.primary_artist?.name || artist,
                lyrics: lyricsText,
                geniusUrl: geniusUrl,
                geniusId: searchResult.id
            };

        } catch (error) {
            console.error('Error fetching from Genius:', error.message);
            return null;
        }
    },

    /**
     * Search Genius API for a song
     * @param {string} songName - Song name
     * @param {string} artist - Artist name
     * @returns {Promise<object|null>} Search result or null
     */
    async searchGenius(songName, artist) {
        try {
            const accessToken = process.env.GENIUS_ACCESS_TOKEN;
            
            if (!accessToken) {
                console.error('Genius access token not configured');
                return null;
            }

            const searchQuery = `${songName} ${artist}`;
            const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(searchQuery)}`;
            
            const response = await axios.get(searchUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'User-Agent': 'Gobletto/1.0.0'
                },
                timeout: 10000 // 10 second timeout
            });

            const hits = response.data.response?.hits;
            
            if (!hits || hits.length === 0) {
                return null;
            }

            // Find the best match
            const bestMatch = this.findBestGeniusMatch(hits, songName, artist);
            
            return bestMatch?.result || hits[0]?.result || null;

        } catch (error) {
            console.error('Genius API search error:', error.message);
            if (error.response) {
                console.error('Genius API response:', error.response.status, error.response.data);
            }
            return null;
        }
    },

    /**
     * Find the best matching Genius result
     * @param {Array} hits - Genius search hits
     * @param {string} songName - Target song name
     * @param {string} artist - Target artist name
     * @returns {object|null} Best match or null
     */
    findBestGeniusMatch(hits, songName, artist) {
        const cleanTargetTitle = this.cleanString(songName);
        const cleanTargetArtist = this.cleanString(artist);
        
        let bestMatch = null;
        let bestScore = 0;

        for (const hit of hits) {
            const result = hit.result;
            const cleanHitTitle = this.cleanString(result.title);
            const cleanHitArtist = this.cleanString(result.primary_artist?.name || '');
            
            let score = 0;
            
            // Title matching
            if (cleanHitTitle === cleanTargetTitle) {
                score += 100;
            } else if (cleanHitTitle.includes(cleanTargetTitle) || cleanTargetTitle.includes(cleanHitTitle)) {
                score += 50;
            }
            
            // Artist matching
            if (cleanHitArtist === cleanTargetArtist) {
                score += 100;
            } else if (cleanHitArtist.includes(cleanTargetArtist) || cleanTargetArtist.includes(cleanHitArtist)) {
                score += 40;
            }
            
            // Partial artist matching (for featured artists)
            const featuredArtists = this.extractArtistsFromTitle(result.title);
            if (featuredArtists.some(a => this.cleanString(a) === cleanTargetArtist)) {
                score += 30;
            }
            
            // Popularity bonus
            if (result.stats?.pageviews) {
                score += Math.min(Math.log10(result.stats.pageviews), 20);
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = hit;
            }
        }
        
        return bestMatch;
    },

    /**
     * Scrape lyrics from Genius page
     * @param {string} url - Genius song URL
     * @returns {Promise<string>} Lyrics text
     */
    async scrapeGeniusLyrics(url) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            
            // Try multiple selectors (Genius changes their HTML structure sometimes)
            const selectors = [
                '[data-lyrics-container="true"]',
                'div[class*="Lyrics__Container"]',
                '.lyrics',
                '.song_body-lyrics'
            ];

            let lyrics = '';

            for (const selector of selectors) {
                const elements = $(selector);
                if (elements.length > 0) {
                    elements.each((i, element) => {
                        const text = $(element).text().trim();
                        if (text) {
                            lyrics += text + '\n\n';
                        }
                    });
                    
                    if (lyrics.trim().length > 0) {
                        break;
                    }
                }
            }

            // Clean up the lyrics
            if (lyrics) {
                lyrics = this.cleanLyricsText(lyrics);
            }

            return lyrics;

        } catch (error) {
            console.error('Error scraping Genius lyrics:', error.message);
            return '';
        }
    },

    /**
     * Try fallback lyric sources
     * @param {string} songName - Song name
     * @param {string} artist - Artist name
     * @returns {Promise<object|null>} Lyrics data or null
     */
    async fetchFromFallbackSources(songName, artist) {
        if (!songName || !artist) {
            return null;
        }

        try {
            // Try Lyrics.ovh API
            const lyricsOvh = await this.fetchFromLyricsOvh(songName, artist);
            if (lyricsOvh) {
                return lyricsOvh;
            }

            // Try other fallback sources here if needed
            // e.g., Musixmatch, AZLyrics scraping, etc.

            return null;

        } catch (error) {
            console.error('Error in fallback sources:', error.message);
            return null;
        }
    },

    /**
     * Fetch from Lyrics.ovh API
     * @param {string} songName - Song name
     * @param {string} artist - Artist name
     * @returns {Promise<object|null>} Lyrics data or null
     */
    async fetchFromLyricsOvh(songName, artist) {
        try {
            const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(songName)}`;
            
            const response = await axios.get(url, {
                timeout: 5000
            });

            if (response.data.lyrics) {
                return {
                    songName: songName,
                    artist: artist,
                    lyrics: response.data.lyrics,
                    sourceUrl: url
                };
            }

            return null;

        } catch (error) {
            // Lyrics.ovh often returns 404 for missing lyrics, which is expected
            if (error.response?.status !== 404) {
                console.error('Lyrics.ovh API error:', error.message);
            }
            return null;
        }
    },

    /**
     * Batch get lyrics for multiple tracks
     * @param {Array} tracks - Array of track objects with spotifyTrackId, name, artist
     * @returns {Promise<Array>} Array of lyrics results
     */
    async batchGetLyrics(tracks) {
        const results = [];
        
        for (const track of tracks) {
            try {
                const lyrics = await this.getLyrics(
                    track.spotifyTrackId,
                    track.name,
                    track.artist
                );
                
                results.push({
                    spotifyTrackId: track.spotifyTrackId,
                    ...lyrics
                });
                
                // Small delay to avoid rate limiting
                await this.delay(200);
                
            } catch (error) {
                results.push({
                    spotifyTrackId: track.spotifyTrackId,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    },

    /**
     * Delete cached lyrics
     * @param {string} spotifyTrackId - Spotify track ID
     * @returns {Promise<object>} Deletion result
     */
    async deleteCachedLyrics(spotifyTrackId) {
        try {
            const result = await lyrics.deleteOne({ spotifyTrackId: spotifyTrackId });
            
            return {
                success: true,
                deletedCount: result.deletedCount,
                message: result.deletedCount > 0 
                    ? 'Lyrics deleted from cache' 
                    : 'No lyrics found in cache'
            };
        } catch (error) {
            console.error('Error deleting cached lyrics:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Search lyrics database
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching lyrics
     */
    async searchLyrics(query) {
        try {
            const results = await lyrics.find({
                $or: [
                    { songName: { $regex: query, $options: 'i' } },
                    { artist: { $regex: query, $options: 'i' } },
                    { lyrics: { $regex: query, $options: 'i' } }
                ]
            }).limit(20);

            return {
                success: true,
                count: results.length,
                results: results.map(r => ({
                    spotifyTrackId: r.spotifyTrackId,
                    songName: r.songName,
                    artist: r.artist,
                    lyricsPreview: r.lyrics.substring(0, 100) + '...'
                }))
            };
        } catch (error) {
            console.error('Error searching lyrics:', error.message);
            return {
                success: false,
                error: error.message,
                results: []
            };
        }
    },

    /**
     * Helper: Clean string for comparison
     */
    cleanString(str) {
        if (!str) return '';
        return str.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    },

    /**
     * Helper: Extract artists from song title (for featured artists)
     */
    extractArtistsFromTitle(title) {
        const artists = [];
        
        // Look for patterns like "Song (feat. Artist)" or "Song ft. Artist"
        const featPatterns = [
            /feat\.\s*([^)]+)/i,
            /ft\.\s*([^)]+)/i,
            /featuring\s*([^)]+)/i,
            /with\s*([^)]+)/i
        ];
        
        for (const pattern of featPatterns) {
            const match = title.match(pattern);
            if (match) {
                artists.push(match[1].trim());
            }
        }
        
        return artists;
    },

    /**
     * Helper: Clean lyrics text
     */
    cleanLyricsText(text) {
        return text
            .replace(/\[.*?\]/g, '') // Remove [Verse], [Chorus], etc.
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double
            .replace(/^\s+|\s+$/g, '') // Trim
            .replace(/Lyrics from Snippet:.*$/g, '') // Remove snippet notices
            .replace(/You might also like/g, '') // Remove Genius ads
            .trim();
    },

    /**
     * Helper: Delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Get Genius API status
     */
    async getGeniusStatus() {
        try {
            const accessToken = process.env.GENIUS_ACCESS_TOKEN;
            
            if (!accessToken) {
                return {
                    configured: false,
                    message: 'Genius access token not configured'
                };
            }

            // Make a simple search to test the API
            const response = await axios.get('https://api.genius.com/search?q=test', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                timeout: 5000
            });

            return {
                configured: true,
                status: 'operational',
                rateLimit: response.headers['x-ratelimit-remaining'] || 'unknown',
                resetTime: response.headers['x-ratelimit-reset'] || 'unknown'
            };

        } catch (error) {
            return {
                configured: true,
                status: 'error',
                message: error.message,
                statusCode: error.response?.status
            };
        }
    }
};
module.exports = lyricsService;