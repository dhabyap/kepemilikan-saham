// ─────────────────────── HELPERS ───────────────────────
const API = '';

function formatNumber(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('id-ID');
}

function pctClass(pct) {
  if (pct >= 20) return 'pct-high';
  if (pct >= 5) return 'pct-medium';
  return 'pct-low';
}

function badgeLF(lf) {
  if (lf === 'L') return '<span class="badge badge-local">Lokal</span>';
  if (lf === 'A') return '<span class="badge badge-foreign">Asing</span>';
  return '<span class="badge badge-type">—</span>';
}

async function fetchJSON(url) {
  const res = await fetch(API + url);
  return res.json();
}

// Chart.js global defaults for dark theme
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(30, 48, 72, 0.5)';
Chart.defaults.font.family = "'Inter', sans-serif";

// ─────────────────────── LOAD STATS ───────────────────────
async function loadStats() {
  const stats = await fetchJSON('/api/stats');
  document.getElementById('statIssuers').textContent = formatNumber(stats.total_issuers);
  document.getElementById('statInvestors').textContent = formatNumber(stats.total_investors);
  document.getElementById('statRecords').textContent = formatNumber(stats.total_records);
  document.getElementById('statAvgPct').textContent = stats.avg_percentage + '%';
  document.getElementById('statMaxPct').textContent = stats.max_percentage + '%';
}

// ─────────────────────── LOCAL VS FOREIGN CHART ───────────────────────
async function loadLocalForeignChart() {
  const data = await fetchJSON('/api/local-vs-foreign');

  const colors = {
    'Lokal': '#10b981',
    'Asing': '#8b5cf6',
    'Tidak Diketahui': '#64748b'
  };

  new Chart(document.getElementById('chartLocalForeign'), {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.category),
      datasets: [{
        data: data.map(d => d.record_count),
        backgroundColor: data.map(d => colors[d.category] || '#64748b'),
        borderWidth: 2,
        borderColor: '#1a2332',
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const row = data[ctx.dataIndex];
              return [
                `${ctx.label}: ${formatNumber(row.record_count)} record`,
                `Investor: ${formatNumber(row.investor_count)}`,
                `Emiten: ${formatNumber(row.issuer_count)}`,
                `Avg: ${row.avg_percentage}%`
              ];
            }
          }
        }
      }
    }
  });
}

// ─────────────────────── INVESTOR TYPES CHART ───────────────────────
async function loadInvestorTypesChart() {
  const data = await fetchJSON('/api/investor-types');

  const palette = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#f97316', '#ec4899', '#14b8a6', '#6366f1'];

  new Chart(document.getElementById('chartInvestorTypes'), {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.type_label),
      datasets: [{
        data: data.map(d => d.record_count),
        backgroundColor: palette.slice(0, data.length),
        borderWidth: 2,
        borderColor: '#1a2332',
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 12, usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const row = data[ctx.dataIndex];
              return [
                `${ctx.label}: ${formatNumber(row.record_count)} record`,
                `Investor: ${formatNumber(row.investor_count)}`,
                `Avg: ${row.avg_percentage}%`
              ];
            }
          }
        }
      }
    }
  });
}

// ─────────────────────── TOP HOLDINGS BAR CHART ───────────────────────
async function loadTopHoldingsChart() {
  const data = await fetchJSON('/api/top-holdings?limit=15');

  const labels = data.map(d => `${d.share_code} - ${d.investor_name.substring(0, 25)}`);

  new Chart(document.getElementById('chartTopHoldings'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Kepemilikan (%)',
        data: data.map(d => d.percentage),
        backgroundColor: data.map((_, i) => {
          const colors = ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b'];
          return colors[i % colors.length] + 'cc';
        }),
        borderColor: data.map((_, i) => {
          const colors = ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b'];
          return colors[i % colors.length];
        }),
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => {
              const d = data[items[0].dataIndex];
              return `${d.share_code} — ${d.issuer_name}`;
            },
            label: (ctx) => {
              const d = data[ctx.dataIndex];
              return [
                `Investor: ${d.investor_name}`,
                `Kepemilikan: ${d.percentage}%`,
                `Saham: ${formatNumber(d.total_holding_shares)}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(30, 48, 72, 0.3)' },
          ticks: { callback: v => v + '%' }
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}

// ─────────────────────── TOP INVESTORS TABLE ───────────────────────
async function loadTopInvestors() {
  const data = await fetchJSON('/api/top-investors?limit=20');
  const tbody = document.querySelector('#topInvestorsTable tbody');

  tbody.innerHTML = data.map((d, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="name-cell" title="${d.investor_name}">${d.investor_name}</td>
      <td><span class="badge badge-type">${d.investor_type}</span></td>
      <td>${badgeLF(d.local_foreign)}</td>
      <td class="number-cell">${d.companies_count}</td>
      <td class="pct-cell ${pctClass(d.avg_percentage)}">${d.avg_percentage}%</td>
    </tr>
  `).join('');
}

// ─────────────────────── MOST DISTRIBUTED TABLE ───────────────────────
async function loadMostDistributed() {
  const data = await fetchJSON('/api/most-distributed?limit=20');
  const tbody = document.querySelector('#mostDistributedTable tbody');

  tbody.innerHTML = data.map((d, i) => `
    <tr onclick="showIssuerDetail('${d.share_code}', '${d.issuer_name.replace(/'/g, "\\'")}')">
      <td>${i + 1}</td>
      <td class="code-cell">${d.share_code}</td>
      <td class="name-cell" title="${d.issuer_name}">${d.issuer_name}</td>
      <td class="number-cell">${d.shareholder_count}</td>
      <td class="pct-cell ${pctClass(d.total_tracked_pct)}">${d.total_tracked_pct}%</td>
      <td class="pct-cell ${pctClass(d.largest_holding_pct)}">${d.largest_holding_pct}%</td>
    </tr>
  `).join('');
}

// ─────────────────────── ALL ISSUERS TABLE ───────────────────────
async function loadIssuers() {
  const data = await fetchJSON('/api/issuers');
  const tbody = document.querySelector('#issuersTable tbody');

  tbody.innerHTML = data.map((d, i) => `
    <tr onclick="showIssuerDetail('${d.share_code}', '${d.issuer_name.replace(/'/g, "\\'")}')">
      <td>${i + 1}</td>
      <td class="code-cell">${d.share_code}</td>
      <td class="name-cell" title="${d.issuer_name}">${d.issuer_name}</td>
      <td class="number-cell">${d.investor_count}</td>
      <td class="pct-cell ${pctClass(d.total_tracked_pct)}">${d.total_tracked_pct}%</td>
      <td class="pct-cell ${pctClass(d.largest_pct)}">${d.largest_pct}%</td>
      <td>${(d.ownership_types || '').split(',').map(t => badgeLF(t)).join(' ')}</td>
    </tr>
  `).join('');
}

// ─────────────────────── KONGLOMERAT TABLE ───────────────────────
async function loadKonglomerat() {
  const data = await fetchJSON('/api/konglomerat');
  const tbody = document.querySelector('#kongloTable tbody');
  
  tbody.innerHTML = data.map((d, i) => {
    const stocksHtml = d.stocks.map(s => `<span class="badge" style="background:var(--accent-blue);color:#fff;margin-right:4px;">${s}</span>`).join('');
    const sectorsHtml = d.sector.map(s => `<span class="badge" style="background:#475569;color:#fff;margin-right:4px;">${s}</span>`).join('');
    
    return `
    <tr>
      <td>${i + 1}</td>
      <td class="name-cell" style="font-weight:600">${d.nama}</td>
      <td>${d.nama_grup}</td>
      <td><span style="color:var(--text-muted);font-size:0.9rem">${d.role}</span></td>
      <td>${sectorsHtml}</td>
      <td>${stocksHtml}</td>
    </tr>
  `}).join('');
}

// View Toggling
const dashView = document.getElementById('dashboardView');
const kongloView = document.getElementById('kongloView');
const btnDash = document.getElementById('viewDashboardBtn');
const btnKonglo = document.getElementById('viewKongloBtn');

btnKonglo.addEventListener('click', () => {
  dashView.style.display = 'none';
  kongloView.style.display = 'block';
  btnKonglo.style.display = 'none';
  btnDash.style.display = 'inline-block';
  loadKonglomerat(); // load on demand or refresh
});

btnDash.addEventListener('click', () => {
  kongloView.style.display = 'none';
  dashView.style.display = 'block';
  btnDash.style.display = 'none';
  btnKonglo.style.display = 'inline-block';
});

// ─────────────────────── ISSUER DETAIL MODAL ───────────────────────
async function showIssuerDetail(code, name) {
  const overlay = document.getElementById('modalOverlay');
  const tbody = document.querySelector('#modalTable tbody');

  document.getElementById('modalShareCode').textContent = code;
  document.getElementById('modalIssuerName').textContent = '— ' + name;
  tbody.innerHTML = '<tr><td colspan="10"><div class="loading-spinner"><div class="spinner"></div> Memuat data...</div></td></tr>';
  overlay.classList.add('active');

  const data = await fetchJSON(`/api/issuer/${code}`);

  tbody.innerHTML = data.map((d, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="name-cell" title="${d.investor_name}">${d.investor_name}</td>
      <td><span class="badge badge-type">${d.investor_type}</span></td>
      <td>${badgeLF(d.local_foreign)}</td>
      <td>${d.nationality || '—'}</td>
      <td>${d.domicile || '—'}</td>
      <td class="number-cell">${formatNumber(d.holdings_scripless)}</td>
      <td class="number-cell">${formatNumber(d.holdings_scrip)}</td>
      <td class="number-cell">${formatNumber(d.total_holding_shares)}</td>
      <td class="pct-cell ${pctClass(d.percentage)}">${d.percentage}%</td>
    </tr>
  `).join('');
}

// Close modal
document.getElementById('modalClose').addEventListener('click', () => {
  document.getElementById('modalOverlay').classList.remove('active');
});
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    e.currentTarget.classList.remove('active');
  }
});

// ─────────────────────── SEARCH ───────────────────────
let searchTimeout;
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const q = e.target.value.trim();

  if (q.length < 2) {
    searchResults.classList.remove('active');
    return;
  }

  searchTimeout = setTimeout(async () => {
    const data = await fetchJSON(`/api/search?q=${encodeURIComponent(q)}`);

    if (data.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item" style="cursor:default;color:var(--text-muted)">Tidak ada hasil ditemukan</div>';
    } else {
      // Group by share_code for cleaner display
      const grouped = {};
      data.forEach(d => {
        if (!grouped[d.share_code]) {
          grouped[d.share_code] = { ...d, investors: [] };
        }
        grouped[d.share_code].investors.push(d);
      });

      searchResults.innerHTML = Object.values(grouped).map(g => `
        <div class="search-result-item" 
             onclick="showIssuerDetail('${g.share_code}', '${(g.issuer_name || g.investor_name).replace(/'/g, "\\'")}'); searchResults.classList.remove('active'); searchInput.value = '';">
          <span class="search-result-code">${g.share_code}</span>
          <span class="search-result-name">${g.issuer_name || g.investor_name}</span>
          <span class="search-result-pct ${pctClass(g.percentage)}">${g.investors.length} investor</span>
        </div>
      `).join('');
    }
    searchResults.classList.add('active');
  }, 300);
});

// Close search on click outside
document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.classList.remove('active');
  }
});

// ─────────────────────── ADMIN UPLOAD ───────────────────────
const adminBtn = document.getElementById('adminBtn');
const adminModalOverlay = document.getElementById('adminModalOverlay');
const adminModalClose = document.getElementById('adminModalClose');
const uploadForm = document.getElementById('uploadForm');
const pdfFileInput = document.getElementById('pdfFileInput');
const fileDropArea = document.getElementById('fileDropArea');
const selectedFileName = document.getElementById('selectedFileName');
const uploadStatus = document.getElementById('uploadStatus');
const uploadBtn = document.getElementById('uploadBtn');

adminBtn.addEventListener('click', () => adminModalOverlay.classList.add('active'));
adminModalClose.addEventListener('click', () => adminModalOverlay.classList.remove('active'));
adminModalOverlay.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) adminModalOverlay.classList.remove('active');
});

// File drag & drop UX
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  fileDropArea.addEventListener(eventName, preventDefaults, false);
});
function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

['dragenter', 'dragover'].forEach(eventName => {
  fileDropArea.addEventListener(eventName, () => fileDropArea.classList.add('dragover'), false);
});
['dragleave', 'drop'].forEach(eventName => {
  fileDropArea.addEventListener(eventName, () => fileDropArea.classList.remove('dragover'), false);
});

pdfFileInput.addEventListener('change', function() {
  if (this.files && this.files[0]) {
    selectedFileName.textContent = `Akan diupload: ${this.files[0].name}`;
  } else {
    selectedFileName.textContent = '';
  }
});

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!pdfFileInput.files || !pdfFileInput.files[0]) {
    uploadStatus.innerHTML = '<span style="color:var(--accent-rose)">Pilih file PDF terlebih dahulu.</span>';
    return;
  }

  const formData = new FormData();
  formData.append('pdfFile', pdfFileInput.files[0]);

  uploadBtn.disabled = true;
  uploadBtn.innerHTML = '<div class="spinner" style="border-color:rgba(255,255,255,0.3); border-top-color:white; width:16px; height:16px;"></div> Memproses... Bisa memakan waktu lama.';
  uploadStatus.innerHTML = 'Memproses PDF dan mengekstrak data...';

  try {
    const response = await fetch('/api/upload-pdf', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) throw new Error(result.error || 'Upload failed');
    
    uploadStatus.innerHTML = `<span style="color:var(--accent-emerald)">${result.message}</span>`;
    
    // Reload dashboard data
    setTimeout(() => {
      adminModalOverlay.classList.remove('active');
      uploadBtn.disabled = false;
      uploadBtn.innerText = 'Upload & Ekstrak Data';
      pdfFileInput.value = '';
      selectedFileName.textContent = '';
      uploadStatus.innerHTML = '';
      init(); // refresh dashboard
    }, 2000);
    
  } catch (error) {
    console.error('Upload error:', error);
    uploadStatus.innerHTML = `<span style="color:var(--accent-rose)">Error: ${error.message}</span>`;
    uploadBtn.disabled = false;
    uploadBtn.innerText = 'Upload & Ekstrak Data';
  }
});

// ─────────────────────── INIT ───────────────────────
async function init() {
  try {
    await Promise.all([
      loadStats(),
      loadLocalForeignChart(),
      loadInvestorTypesChart(),
      loadTopHoldingsChart(),
      loadTopInvestors(),
      loadMostDistributed(),
      loadIssuers(),
      loadKonglomerat()
    ]);
  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

init();
