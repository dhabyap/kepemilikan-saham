// --- Check if already logged in ---
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    try {
      const res = await fetch('/api/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        window.location.href = '/admin.html';
      } else {
        localStorage.removeItem('adminToken');
      }
    } catch (err) {
      console.error('Token verification failed:', err);
    }
  }
});

// --- Handle Login Form Submission ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = document.getElementById('loginBtn');
  const errorMsg = document.getElementById('errorMsg');
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Memproses...';
  errorMsg.textContent = '';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Login gagal.');
    }

    // Save token
    localStorage.setItem('adminToken', data.token);
    
    // Redirect to admin panel
    window.location.href = '/admin.html';
    
  } catch (err) {
    errorMsg.textContent = err.message;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Masuk';
  }
});
