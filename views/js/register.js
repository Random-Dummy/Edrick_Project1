$(async function () {
    console.log('Register script loaded'); // Debug log
    
    $('#register-form').on('submit', registerUser);

    $('#togglePassword').on('click', function () {
        const passwordInput = $('#password');
        const type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
        passwordInput.attr('type', type);
        $(this).toggleClass('fa-eye fa-eye-slash');
    });
});

async function registerUser(e) {
    e.preventDefault();
    let data = new FormData(e.target);
    let entries = Object.fromEntries(data.entries());
    
    try {
        let response = await fetch('/user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(entries)
        });
        let responseData = await response.json();
        if (response.ok) {
            showNotification("Registration successful! Please log in.", 'success');
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else {
            console.log('Registration failed:', responseData); // Debug log
            showNotification(`Registration failed: ${responseData.message || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Registration error:', error); // Debug log
        showNotification(`Registration error: ${error.message}`, 'error');
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

    // Optional: Click to dismiss
    $('#notification').on('click', function () {
        $(this).removeClass('show');
        setTimeout(() => $(this).remove(), 300);
    });
}
