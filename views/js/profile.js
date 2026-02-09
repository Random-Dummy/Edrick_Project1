$(document).ready(function () {
    console.log("Profile page loaded");

    if (!sessionStorage.token) {
        console.warn("No token found, redirecting to login");
        window.location.href = "login.html";
        return;
    }

    getUserProfile();
    checkSpotifyConnection();

    $('#connect-spotify-btn').on('click', function (e) {
        e.preventDefault();
        getAuthURL();
    });

    $('#profile-form').on('submit', function (e) {
        e.preventDefault();
        updateProfile();
    });

    $('#logoutbutton').on('click', function () {
        sessionStorage.clear();
        window.location.href = "login.html";
    });
});

async function getUserProfile() {
    try {
        const response = await fetch(
            `${BASE_URL}/user?token=${sessionStorage.token}`
        );

        if (!response.ok) throw new Error("User fetch failed");

        const user = await response.json();
        console.log("User data:", user);

        if (user.success) {
            $('#email').val(user.email);
            $('#username').val(user.username || "");
        } else {
            showMessage(user.message || "Failed to load profile", "error");
        }
    } catch (error) {
        console.error("Profile load error:", error);
        showMessage("Failed to load profile", "error");
    }
}

async function updateProfile() {
    const username = $('#username').val().trim();
    const password = $('#password').val();
    const confirmPassword = $('#confirm-password').val();

    if (!username) {
        showMessage("Username is required", "error");
        return;
    }

    if (password && password !== confirmPassword) {
        showMessage("Passwords do not match", "error");
        return;
    }

    const payload = { username };
    if (password) payload.password = password;

    try {
        const response = await fetch(
            `${BASE_URL}/user?token=${sessionStorage.token}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }
        );

        const result = await response.json();
        console.log("Update profile response:", result);

        if (response.ok && result.success) {
            showMessage("Profile updated successfully!", "success");
            $('#password, #confirm-password').val("");
        } else {
            showMessage(result.message || "Update failed", "error");
        }
    } catch (error) {
        console.error("Profile update error:", error);
        showMessage("Server error updating profile", "error");
    }
}

function showMessage(message, type) {
    const el = $('#message-area');
    el.text(message).removeClass().addClass(`message-area ${type}`);

    setTimeout(() => el.text("").removeClass(type), 5000);
}

/* =======================
   Spotify Auth
======================= */
async function getAuthURL() {
    console.log("🎧 Connecting to Spotify...");

    try {
        const response = await fetch(`${BASE_URL}/spotify/connect?token=${sessionStorage.token}`);
        const data = await response.json();
        console.log("Spotify connect response:", data);

        if (response.ok && data.url) {
            window.location.href = data.url; // <-- redirect
        } else {
            showMessage(data.message || "Spotify connection failed", "error");
        }
    } catch (error) {
        console.error("Spotify auth error:", error);
        showMessage("Error connecting to Spotify", "error");
    }
}

/* =======================
   Spotify Stats
======================= */
async function checkSpotifyConnection() {
    console.log("🔍 Checking Spotify connection...");
    try {
        const response = await fetch(`${BASE_URL}/spotify/stats?token=${sessionStorage.token}`);
        const data = await response.json();
        console.log("Spotify stats:", data);

        if (data.success && data.connected) {
            $('#spotify-connect-section').hide();
            $('#spotify-stats-section').show();
            displayStats(data.stats);
        } else {
            $('#spotify-connect-section').show();
            $('#spotify-stats-section').hide();
        }
    } catch (error) {
        console.warn("Spotify not connected:", error);
        $('#spotify-connect-section').show();
        $('#spotify-stats-section').hide();
    }
}

function displayStats(stats) {
    $('#hours-played-count').text(stats?.hoursPlayed || 0);
    $('#top-tracks-month-list').html(
        (stats?.topTracksMonth || []).map(createTrackItem).join("")
    );
    $('#top-tracks-alltime-list').html(
        (stats?.topTracksAllTime || []).map(createTrackItem).join("")
    );
    $('#top-artists-alltime-list').html(
        (stats?.topArtistsAllTime || []).map((artist, i) => `
            <li class="stat-item">
                <span class="stat-number">${i + 1}</span>
                <img src="${artist.image || './assets/default-album.png'}" class="stat-img rounded-circle">
                <div class="stat-info">
                    <a href="${artist.url}" target="_blank">${artist.name}</a>
                </div>
            </li>
        `).join("")
    );
}

function createTrackItem(track, index) {
    return `
        <li class="stat-item">
            <span class="stat-number">${index + 1}</span>
            <img src="${track.image || './assets/default-album.png'}" class="stat-img">
            <div class="stat-info">
                <a href="${track.url}" target="_blank">${track.name}</a>
                <span>${track.artist}</span>
            </div>
        </li>
    `;
}