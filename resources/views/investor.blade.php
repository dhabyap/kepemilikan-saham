<!DOCTYPE html>
<html lang="id">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Investor Profile | Stock Disclosure Monitoring</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('style.css') }}">
</head>

<body class="investor-profile-page">

  <header class="sec-header">
    <nav class="main-nav">
      <div class="brand">
        <a href="{{ url('/') }}"
          style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 12px;">
          <div class="brand-logo">🏛️</div>
          <div class="brand-text">
            <h1>Stock Disclosure</h1>
            <p>KSEI Institutional Monitoring System</p>
          </div>
        </a>
      </div>
      <div class="nav-links">
        <a href="{{ url('/') }}" class="nav-link">Home</a>
        <a href="{{ url('/network.html') }}" class="nav-link">🔗 Network Graph</a>
      </div>
    </nav>
  </header>

  <main class="container" id="profile-container">
    <div style="padding: 100px 0; text-align: center; color: var(--text-muted);">
      <div class="loading-spinner" style="margin: 0 auto 20px;"></div>
      <p>Retrieving Intelligence Data...</p>
    </div>
  </main>

  <footer class="sec-footer">
    <div class="footer-bottom">
      <div style="font-size: 0.72rem; opacity: 0.5;">Data source: KSEI institutional reporting. Verification required
        for investment decisions.</div>
      <div style="font-size: 0.72rem; opacity: 0.45;">© 2026 KSEI Monitoring Dashboard.</div>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="{{ asset('app.js') }}"></script>
  <script src="{{ asset('investor-profile.js') }}"></script>
  <script>
    // Initialize profile on load
    document.addEventListener('DOMContentLoaded', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const name = urlParams.get('name');
      if (name) {
        if (typeof loadInvestorProfile === 'function') {
          loadInvestorProfile(name);
        }
      } else {
        window.location.href = "{{ url('/') }}";
      }
    });
  </script>
</body>

</html>