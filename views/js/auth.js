$(function () {
    // Page detection
    const currentPage = window.location.pathname.split("/").pop();

    // Auth check for all pages
    if (!sessionStorage.token && currentPage !== "login.html" && currentPage !== "register.html") {
        window.location.href = "login.html";
    } else if (sessionStorage.token && (currentPage === "login.html" || currentPage === "register.html")) {
        window.location.href = "index.html";
    }

    // Login functionality
    $('#login-form').on('submit', async function (e) {
        e.preventDefault();

        const email = $(this).find('[name="email"]').val();
        const password = $(this).find('[name="password"]').val();

        try {
            const response = await fetch(LOGIN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                sessionStorage.setItem('token', data.token);
                window.location.href = 'index.html';
            } else {
                const data = await response.json();
                alert(data.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    });

    // Registration functionality
    $('#register-form').on('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        const entries = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(REGISTER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entries)
            });

            if (response.ok) {
                const data = await response.json();
                showNotification("Registration successful! Please log in.", 'success');
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            } else {
                const data = await response.json();
                showNotification(`Registration failed: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('Registration failed. Please try again.', 'error');
        }
    });

    // Password toggle functionality
    $('#togglePassword').on('click', function () {
        const passwordInput = $('#password');
        const type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
        passwordInput.attr('type', type);
        $(this).toggleClass('fa-eye fa-eye-slash');
    });

    // Logout functionality
    const logoutButton = $('#logoutbutton');
    if (logoutButton.length) {
        logoutButton.on('click', logout);
    }

    // Notification system
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

    // Logout function
    async function logout() {
        try {
            const response = await fetch(LOGOUT_URL + "?token=" + sessionStorage.token);

            sessionStorage.removeItem("token");

            if (response.ok) {
                location.href = "login.html";
            } else {
                const err = await response.json();
                console.log(err.message);
                location.href = "login.html";
            }
        } catch (error) {
            console.error("Error during logout:", error);
            sessionStorage.removeItem("token");
            location.href = "login.html";
        }
    }
});