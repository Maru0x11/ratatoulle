import { getCsrfToken } from './auth.js';

function showError(msg) {
  const el = document.getElementById('error-message');
  el.textContent = msg;
  el.style.display = 'block';
}

function hideError() {
  const el = document.getElementById('error-message');
  el.style.display = 'none';
}

document.querySelector('.btn-login').addEventListener('click', async function (e) {
  e.preventDefault();
  hideError();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showError('Please enter your username and password.');
    return;
  }

  try {
    const response = await fetch('/api/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      if (data.user.is_admin) {
        window.location.href = 'index_admin.html';
      } else {
        window.location.href = 'index.html';
      }
    } else {
      showError(data.error || 'Login failed. Please try again.');
    }
  } catch (err) {
    console.error('Login error:', err);
    showError('An error occurred. Please try again later.');
  }
});
