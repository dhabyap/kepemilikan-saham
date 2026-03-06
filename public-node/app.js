// ─────────────────────── HELPERS ───────────────────────
const API = '';
let selectedDate = '';

function formatNumber(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('id-ID');
}

function pctClass(pct) {
  if (pct >= 20) return 'pct-high';
  if (pct >= 5) return 'pct-medium';
  return 'pct-low';
}

function formatInvestorType(code) {
  if (!code || code === '-' || code.trim() === '') return 'Lainnya';
  const map = {
    'CP': 'Korporat',
    'ID': 'Individu',
    'IB': 'Inv. Banking',
    'IS': 'Asuransi',
    'SC': 'Sekuritas',
    'FD': 'Yayasan',
    'MF': 'Reksadana',
    'PF': 'Dapen',
    'OT': 'Lainnya'
  };
  return map[code] || 'Lainnya';
}

function badgeLF(lf) {
  if (lf === 'L') return '<span class="lf-badge lf-local">🇮🇩 Lokal</span>';
  if (lf === 'A') return '<span class="lf-badge lf-asing">🌏 Asing</span>';
  return '<span class="lf-badge lf-other">Unknown</span>';
}

function pctColorClass(pct) {
  const p = parseFloat(pct);
  if (p >= 25) return 'pct-high';
  if (p >= 10) return 'pct-mid';
  return 'pct-low';
}

function typeBadgeClass(code) {
  if (code === 'CP') return 'badge-corp';
  if (code === 'IB' || code === 'SC') return 'badge-inst';
  if (code === 'ID') return 'badge-default';
  return 'badge-default';
}

async function fetchJSON(url) {
  const urlObj = new URL(url, window.location.origin);
  const dateFilter = document.getElementById('dateSelect');
  const date = dateFilter ? dateFilter.value : '';
  if (date) urlObj.searchParams.set('date', date);
  const res = await fetch(urlObj.toString());
  return res.json();
}

// Chart.js defaults
Chart.defaults.color = '#8896a5';
Chart.defaults.borderColor = 'rgba(0,0,0,0.06)';
Chart.defaults.font.family = "'Inter', sans-serif";

// ─────────────────────── LOAD STATS ───────────────────────
async function loadStats() {
  try {
    const stats = await fetchJSON('/api/stats');
    if (document.getElementById('stat-total-issuers')) 
      document.getElementById('stat-total-issuers').textContent = formatNumber(stats.total_issuers);
    if (document.getElementById('stat-total-investors'))
      document.getElementById('stat-total-investors').textContent = formatNumber(stats.total_investors);
    
    // Get Local/Foreign for the metric bar
    const lvF = await fetchJSON('/api/local-vs-foreign');
    const local = lvF.find(r => r.category === 'Lokal')?.avg_percentage || 57.3;
    const foreign = lvF.find(r => r.category === 'Asing')?.avg_percentage || 42.7;
    
    if (document.getElementById('stat-avg-pct'))
      document.getElementById('stat-avg-pct').textContent = local + '%';
    if (document.getElementById('stat-foreign-pct'))
      document.getElementById('stat-foreign-pct').textContent = foreign + '%';
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

// ─────────────────────── HIGH DENSITY PANELS ───────────────────────
// helper to make a bar item (for panels)
function barItem(label, sublabel, value, maxValue, colorClass, showPct, link) {
  const pct = Math.min(100, maxValue > 0 ? (value / maxValue) * 100 : 0);
  const display = showPct ? `${value}%` : formatNumber(value);
  return `
    <div class="bar-item" ${link ? `onclick="window.location.href='${link}'" style="cursor:pointer;"` : ''}>
      <div class="bar-item-top">
        <div>
          <div class="bar-label">${label}</div>
          ${sublabel ? `<div class="bar-sublabel">${sublabel}</div>` : ''}
        </div>
        <span class="bar-number ${showPct ? (parseFloat(value) >= 50 ? 'pct-high' : parseFloat(value) >= 20 ? 'pct-mid' : 'pct-low') : ''}">${display}</span>
      </div>
      <div class="bar-track"><div class="bar-fill ${colorClass}" style="width: ${pct}%"></div></div>
    </div>
  `;
}

function formatMiliar(val) {
  const n = parseFloat(val);
  if (isNaN(n) || n === 0) return '0';
  if (n >= 1000000000000) return (n / 1000000000000).toFixed(2) + ' T';
  if (n >= 1000000000) return (n / 1000000000).toFixed(2) + ' Miliar';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + ' jt';
  return n.toLocaleString('id-ID');
}

async function loadMarketOverview() {
  const data = await fetchJSON('/api/investor-types');
  const container = document.getElementById('marketOverviewList');
  if (data && container) {
    const maxCount = Math.max(...data.map(d => d.record_count));
    container.innerHTML = data.slice(0, 7).map((item, i) => {
      const colors = ['bar-navy','bar-gold','bar-blue','bar-green','bar-red','bar-navy','bar-gold'];
      return barItem(item.type_label, `Code: ${item.type_code || 'OT'}`, item.record_count, maxCount, colors[i], false);
    }).join('');
  }
}

async function loadPopularInvestors() {
  const data = await fetchJSON('/api/top-investors?limit=10');
  const container = document.getElementById('popularInvestorsList');
  if (data && container) {
    const maxCount = Math.max(...data.map(d => d.companies_count));
    container.innerHTML = data.slice(0, 8).map((item, idx) =>
      barItem(`${idx + 1}. ${item.investor_name}`, `Active in ${item.companies_count} companies`, item.companies_count, maxCount, 'bar-gold', false, `investor.html?name=${encodeURIComponent(item.investor_name)}`)
    ).join('');
  }
}

async function loadTopForeign() {
  const data = await fetchJSON('/api/top-holdings?limit=100');
  const foreignOnly = data.filter(h => h.local_foreign === 'A').slice(0, 7);
  const container = document.getElementById('topForeignList');
  if (container) {
    container.innerHTML = foreignOnly.map(item =>
      barItem(item.investor_name, `${item.share_code} · ${item.issuer_name || '—'}`, item.percentage, 100, 'bar-blue', true, `investor.html?name=${encodeURIComponent(item.investor_name)}`)
    ).join('');
  }
}

async function loadSubMajority() {
  const data = await fetchJSON('/api/fractional-owners?limit=8');
  const container = document.getElementById('subMajorityList');
  if (container && data && data.length) {
    container.innerHTML = data.map(item =>
      barItem(item.investor_name, `${item.share_code} · ${item.issuer_name || '—'}`, item.percentage, 5, 'bar-green', true, `investor.html?name=${encodeURIComponent(item.investor_name)}`)
    ).join('');
  } else if (container) {
    container.innerHTML = '<div style="padding:2rem; text-align:center; color: var(--text-muted); font-size: 0.8rem;">No sub-majority data available for this date.</div>';
  }
}

// ─────────────────────── RENDER TABLES ───────────────────────
function renderTable(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (!data || data.length === 0) {
    container.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 3rem; color: #8896a5;">No filings found for this selection.</td></tr>';
    return;
  }

  container.innerHTML = data.map(item => {
    const pct = parseFloat(item.percentage);
    const pctColor = pct >= 50 ? '#c62828' : pct >= 20 ? '#f57f17' : '#2e7d32';
    const barW = Math.min(100, pct).toFixed(1);
    const investorUrl = `investor.html?name=${encodeURIComponent(item.investor_name)}`;
    const issuerName = (item.issuer_name || '').replace(/'/g, "\\'");
    
    return `
    <tr>
      <td><span class="ticker-chip" style="cursor:pointer" onclick="showIssuerDetail('${item.share_code}', '${issuerName}')">${item.share_code}</span></td>
      <td class="issuer-name" style="cursor:pointer" onclick="showIssuerDetail('${item.share_code}', '${issuerName}')">${item.issuer_name || '—'}</td>
      <td class="investor-name"><a href="${investorUrl}" style="color: inherit; text-decoration: none; font-weight: 700;">${item.investor_name}</a></td>
      <td class="type-label">${formatInvestorType(item.investor_type)}</td>
      <td>${badgeLF(item.local_foreign)}</td>
      <td>
        <div class="pct-cell" style="cursor:pointer" onclick="window.location.href='${investorUrl}'">
          <div class="pct-track"><div class="pct-fill" style="width:${barW}%; background: ${pctColor};"></div></div>
          <span class="pct-num" style="color: ${pctColor};">${item.percentage}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');
}

async function loadTopHoldings() {
  try {
    const data = await fetchJSON('/api/top-holdings?limit=50');
    renderTable(data, 'holdingsTableBody');
  } catch (e) { console.error(e); }
}

async function loadFractionalOwners() {
  try {
    const data = await fetchJSON('/api/fractional-owners?limit=50');
    renderTable(data, 'fractionalTableBody');
  } catch (e) { console.error(e); }
}

// ─────────────────────── DATES FILTER ───────────────────────
async function loadDates() {
  try {
    const dates = await fetchJSON('/api/dates');
    const dateSelect = document.getElementById('dateSelect');
    if (!dateSelect) return;
    
    dateSelect.innerHTML = '<option value="">Latest Available</option>' + 
      dates.map(d => `<option value="${d}">${d}</option>`).join('');
    
    dateSelect.addEventListener('change', () => {
      refreshDashboard();
    });
  } catch(e) {
    console.error('Failed to load dates', e);
  }
}

// ─────────────────────── SEARCH [RESTORED DROPDOWN] ───────────────────────
let searchTimeout;
async function performManualSearch() {
  const q = document.getElementById('issuerSearch').value.trim();
  if (!q) {
    refreshDashboard();
    return;
  }
  
  try {
    const data = await fetchJSON(`/api/search?q=${encodeURIComponent(q)}`);
    renderTable(data, 'holdingsTableBody');
    document.getElementById('fractionalTableBody').innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #888;">Showing search results only.</td></tr>';
  } catch (err) { console.error('Search error:', err); }
}

const searchInput = document.getElementById('issuerSearch');
const searchResults = document.getElementById('searchResults');

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const q = e.target.value.trim();
    if (q.length < 2) {
      searchResults.style.display = 'none';
      return;
    }

    searchTimeout = setTimeout(async () => {
      const data = await fetchJSON(`/api/search?q=${encodeURIComponent(q)}`);
      if (data.length === 0) {
        searchResults.innerHTML = '<div style="padding: 1rem; color: #888;">No results found</div>';
      } else {
        searchResults.innerHTML = data.slice(0, 10).map(item => {
          const isStock = item.share_code && q.toUpperCase().includes(item.share_code.toUpperCase());
          // If query matches code, prioritize stock detail. Otherwise investor profile.
          const clickAction = (item.share_code && (item.share_code.toUpperCase() === q.toUpperCase() || item.issuer_name?.toUpperCase().includes(q.toUpperCase())))
            ? `showIssuerDetail('${item.share_code}', '${(item.issuer_name || '').replace(/'/g, "\\'")}');`
            : `window.location.href='investor.html?name=${encodeURIComponent(item.investor_name)}'`;
            
          return `
          <div style="padding: 0.75rem 1rem; cursor: pointer; border-bottom: 1px solid var(--sec-gray-light); display: flex; align-items: center; justify-content: space-between;" 
               onclick="${clickAction} document.getElementById('searchResults').style.display='none';">
            <div>
              <span class="code-badge">${item.share_code}</span>
              <span style="font-weight: 600; font-size: 0.9rem;">${item.issuer_name || item.investor_name}</span>
            </div>
            <span style="font-size: 0.65rem; color: #888; text-transform: uppercase; font-weight: 700;">${item.issuer_name ? 'EMITEN' : 'INVESTOR'}</span>
          </div>
        `}).join('');
      }
      searchResults.style.display = 'block';
    }, 300);
  });
}

// ─────────────────────── DETAIL MODALS [RESTORED] ───────────────────────
window.showIssuerDetail = async (code, name) => {
  const modal = document.getElementById('issuerModal');
  const title = document.getElementById('modalIssuerName');
  const content = document.getElementById('issuerDetailContent');
  
  title.textContent = `${code} - ${name}`;
  content.innerHTML = '<div style="padding: 2rem; text-align: center;">Loading regulatory disclosure...</div>';
  modal.classList.add('active');

  try {
    const data = await fetchJSON(`/api/issuer/${code}`);
    content.innerHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Shareholder</th>
              <th>Type</th>
              <th>L/F</th>
              <th style="text-align: right;">Holding %</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                <td style="font-weight: 600;">
                  <a href="investor.html?name=${encodeURIComponent(item.investor_name)}" style="color: var(--navy-700); text-decoration: none;">
                    ${item.investor_name}
                  </a>
                </td>
                <td>${formatInvestorType(item.investor_type)}</td>
                <td>${badgeLF(item.local_foreign)}</td>
                <td style="text-align: right; font-weight: 700;">${item.percentage}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) { content.innerHTML = '<div style="padding: 2rem; color: var(--sec-navy);">Failed to retrieve data.</div>'; }
};

window.showKonglomeratDetail = (item) => {
  const modal = document.getElementById('issuerModal');
  const title = document.getElementById('modalIssuerName');
  const content = document.getElementById('issuerDetailContent');

  title.textContent = `Group Profile: ${item.nama}`;
  content.innerHTML = `
    <div style="padding: 1rem;">
      <div class="panel" style="background: var(--sec-gray-light); margin-bottom: 1.5rem; padding: 1.5rem;">
        <div style="font-size: 0.8rem; color: #888; text-transform: uppercase; margin-bottom: 0.5rem;">Ultimate Beneficial Owner / Group</div>
        <div style="font-size: 1.25rem; font-weight: 800; color: var(--sec-navy);">${item.nama_grup || '-'}</div>
      </div>
      <h4 style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.05em; color: var(--sec-navy); margin-bottom: 1rem;">Tracked Portfolio</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem;">
        ${item.stocks.map(s => `
          <div class="panel" style="text-align: center; cursor: pointer;" onclick="showIssuerDetail('${s}', '')">
            <div class="code-badge" style="font-size: 1rem; padding: 0.5rem 1rem;">${s}</div>
            <div style="font-size: 0.7rem; margin-top: 0.5rem; color: #888;">View Filing</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  modal.classList.add('active');
};

window.showKonglomeratDetailByName = async (name) => {
  if (!name || name === 'Independent/Unknown') return;
  try {
    const data = await fetchJSON('/api/konglomerat');
    const group = data.find(k => k.nama === name || k.nama_grup === name);
    if (group) {
      showKonglomeratDetail(group);
    }
  } catch (e) { console.error('Failed to show group detail', e); }
};

window.closeModal = (id) => {
  document.getElementById(id).classList.remove('active');
};

// ─────────────────────── KONGLOMERAT [RESTORED] ───────────────────────
async function loadKonglomerat() {
  try {
    const data = await fetchJSON('/api/konglomerat');
    const container = document.getElementById('conglomerateGridList');
    if (!container) return;

    container.innerHTML = data.slice(0, 10).map(item => `
      <li class="data-item" style="cursor:pointer" onclick='showKonglomeratDetail(${JSON.stringify(item)})'>
        <div class="item-left">
          <span class="item-label">${item.nama}</span>
        </div>
        <span class="item-value">${item.stocks.length} tickers</span>
      </li>
    `).join('');
  } catch (e) { console.error(e); }
}

// ─────────────────────── INITIALIZE ───────────────────────
async function refreshDashboard() {
  await Promise.all([
    loadStats(),
    loadMarketOverview(),
    loadPopularInvestors(),
    loadTopForeign(),
    loadSubMajority(),
    loadKonglomerat(),
    loadTopHoldings(),
    loadFractionalOwners()
  ]);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadDates();
  await refreshDashboard();
  
  // Enter key support for search
  const searchInput = document.getElementById('issuerSearch');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performManualSearch();
    });
  }

  // Full Archive support
  const btnFullArchive = document.getElementById('btnShowFullArchive');
  if (btnFullArchive) {
    btnFullArchive.addEventListener('click', async () => {
      btnFullArchive.textContent = 'Loading...';
      const data = await fetchJSON('/api/top-holdings?limit=1000');
      renderTable(data, 'holdingsTableBody');
      btnFullArchive.textContent = 'Archive Loaded (1000)';
      btnFullArchive.disabled = true;
    });
  }

  // Click outside modal to close
  const issuerModal = document.getElementById('issuerModal');
  if (issuerModal) {
    issuerModal.addEventListener('click', (e) => {
      if (e.target === issuerModal) closeModal('issuerModal');
    });
  }
});
