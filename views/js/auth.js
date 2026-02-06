// auth.js - Combined jQuery authentication module
$(function () {
    // Check authentication status on page load
    const currentPage = window.location.pathname.split("/").pop();
    const token = sessionStorage.getItem("token");

    const isAuthPage = currentPage === "login.html" || currentPage === "register.html";

    if ((!token || token === "undefined" || token === "null") && !isAuthPage) {
        window.location.href = "login.html";
    }

    if (token && isAuthPage) {
        window.location.href = "index.html";
    }

    // Initialize logout button if exists
    $('#logoutbutton').on('click', function (e) {
        e.preventDefault();
        logout();
    });

    // Initialize login form if exists
    if ($('#login-form').length) {
        $('#login-form').on('submit', handleLogin);
    }

    // Initialize register form if exists
    if ($('#register-form').length) {
        $('#register-form').on('submit', handleRegister);

        // Password toggle for register form
        $('#togglePassword').on('click', function () {
            const passwordInput = $('#password');
            const type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
            passwordInput.attr('type', type);
            $(this).toggleClass('fa-eye fa-eye-slash');
        });
    }
});

// Login handler
async function handleLogin(e) {
    e.preventDefault();

    const email = $('#email').val();
    const password = $('#password').val();

    try {
        const response = await fetch('/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        if (response.ok) {
            const data = await response.json();
            sessionStorage.setItem('token', data.token);
            window.location.href = 'index.html';
        } else {
            const data = await response.json();
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred during login', 'error');
    }
}

// Register handler
async function handleRegister(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const entries = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(entries)
        });

        const responseData = await response.json();

        if (response.ok) {
            showNotification("Registration successful! Please log in.", 'success');
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else {
            console.log('Registration failed:', responseData);
            showNotification(`Registration failed: ${responseData.message || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification(`Registration error: ${error.message}`, 'error');
    }
}

// Logout function
async function logout() {
    try {
        const token = sessionStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch('/user/logout?token=' + token);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('username');

        if (response.ok) {
            window.location.href = 'login.html';
        } else {
            const err = await response.json();
            console.log(err.message);
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error("Error during logout:", error);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('username');
        window.location.href = 'login.html';
    }
}

// Notification utility function
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

// Optional: Add password toggle for login form too
$(function () {
    // Add password toggle to login form if needed
    if ($('#login-toggle-password').length) {
        $('#login-toggle-password').on('click', function () {
            const passwordInput = $('#password');
            const type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
            passwordInput.attr('type', type);
            $(this).toggleClass('fa-eye fa-eye-slash');
        });
    }
});