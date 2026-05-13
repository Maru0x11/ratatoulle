import { getCsrfToken } from './auth.js';

function showError(msg) {
    const el = document.getElementById("error-message");
    el.textContent = msg;
    el.style.display = "block";
}

function hideError() {
    const el = document.getElementById("error-message");
    el.style.display = "none";
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

document.querySelector("form").addEventListener("submit", async function(e) {
    e.preventDefault();
    hideError();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (!username) {
        showError("Please enter a username.");
        return;
    }

    if (!isValidEmail(email)) {
        showError("Please enter a valid email address.");
        return;
    }

    if (password.length < 6) {
        showError("Password must be at least 6 characters.");
        return;
    }

    if (password !== confirm) {
        showError("Passwords do not match.");
        return;
    }

    try {
        const response = await fetch('/api/signup/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = "login.html";
        } else {
            showError(data.error || "Signup failed. Please try again.");
        }
    } catch (err) {
        console.error("Signup error:", err);
        showError("An error occurred. Please try again later.");
    }
});
