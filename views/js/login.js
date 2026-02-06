const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginForm.email.value;
    const password = loginForm.password.value;

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
        alert(data.message);
    }
});