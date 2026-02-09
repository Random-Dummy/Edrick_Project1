$(function () {
    const currentPage = window.location.pathname.split("/").pop();
    const token = sessionStorage.getItem("token");

    const isAuthPage = currentPage === "login.html" || currentPage === "register.html";

    if ((!token || token === "undefined" || token === "null") && !isAuthPage) {
        window.location.href = "login.html";
    }

    if (token && isAuthPage) {
        window.location.href = "index.html";
    }

    $('#logoutbutton').on('click', function (e) {
        e.preventDefault();
        logout();
    });

    if ($('#login-form').length) {
        $('#login-form').on('submit', handleLogin);
    }

    if ($('#register-form').length) {
        $('#register-form').on('submit', handleRegister);
        $('#togglePassword').on('click', function () {
            const passwordInput = $('#password');
            const type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
            passwordInput.attr('type', type);
            $(this).toggleClass('fa-eye fa-eye-slash');
        });
    }
});

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

function showNotification(message, type = 'success', duration = 3000) {
    $('#notification').remove();
    $('body').append(`
        <div id="notification" class="${type}">
            <span id="notification-text">${message}</span>
        </div>
    `);
    $('#notification').css('display', 'block');
    setTimeout(() => {
        $('#notification').addClass('show');
    }, 10);

    setTimeout(() => {
        $('#notification').removeClass('show');
        setTimeout(() => {
            $('#notification').remove();
        }, 300);
    }, duration);
    $('#notification').on('click', function () {
        $(this).removeClass('show');
        setTimeout(() => $(this).remove(), 300);
    });
}

$(function () {
    if ($('#login-toggle-password').length) {
        $('#login-toggle-password').on('click', function () {
            const passwordInput = $('#password');
            const type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
            passwordInput.attr('type', type);
            $(this).toggleClass('fa-eye fa-eye-slash');
        });
    }
});