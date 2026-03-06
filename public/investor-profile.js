/**
 * Investor Profile Rendering Engine
 * Refactored for Smart Money Tracker
 */

window.renderInvestorProfilePage = async (investorName) => {
  const container = document.getElementById('profileContent');
  if (!container) return;

  try {
    const res = await fetch(`/api/investor/${encodeURIComponent(investorName)}`);
    const data = await res.json();
    
    if (!data || !data.holdings || data.holdings.length === 0) {
      container.innerHTML = `<div class="panel" style="padding: 3rem; text-align: center;">No archive data found for <strong>${investorName}</strong></div>`;
      container.classList.remove('loading');
      return;
    }

    const holdings = data.holdings;
    const first = holdings[0];
    const dateFormatted = first.date || '—';
    
    // Formatting helper
    const formatIDRCurrency = (val) => {
      if (!val || val === 0) return 'Rp 0';
      if (val >= 1000000000000) return `Rp ${(val / 1000000000000).toFixed(2)} Triliun`;
      if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(2)} Miliar`;
      return `Rp ${val.toLocaleString('id-ID')}`;
    };

    // Calculate Scripless ratio from holdings
    const totalScripless = holdings.reduce((sum, item) => sum + (BigInt(item.holdings_scripless) || 0n), 0n);
    const totalScrip = holdings.reduce((sum, item) => sum + (BigInt(item.holdings_scrip) || 0n), 0n);
    const totalSharesCount = totalScripless + totalScrip;
    const scriplessPct = totalSharesCount > 0n ? Number((totalScripless * 10000n) / totalSharesCount) / 100 : 100;

    container.classList.remove('loading');
    container.innerHTML = `
      <div class="profile-card">
        <div class="profile-top">
          <div class="profile-image-wrap" style="background: #1a365d; display: flex; align-items: center; justify-content: center;">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(investorName)}&background=1a365d&color=f4f7f6&size=512&font-size=0.35" alt="Investor Avatar" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div class="profile-summary">
            <h1 class="profile-name" style="margin-bottom: 0px;">${investorName}<span>.</span></h1>
            <p class="profile-subtitle" style="margin-top: 5px;">${data.investor_type_insight}   |   Per ${dateFormatted}</p>
            
            <div class="profile-stats-grid">
              <div class="profile-stat-box">
                <div class="profile-stat-label">Jumlah Emiten</div>
                <div class="profile-stat-value">${data.total_stocks} <span class="profile-stat-unit">perusahaan</span></div>
              </div>
              <div class="profile-stat-box gold">
                <div class="profile-stat-label">Market Influence</div>
                <div class="profile-stat-value">${formatIDRCurrency(data.influence_score).replace('Rp ', '')}</div>
              </div>
              <div class="profile-stat-box">
                <div class="profile-stat-label">Largest Holding</div>
                <div class="profile-stat-value">${data.largest_holding}</div>
              </div>
              <div class="profile-stat-box ${data.portfolio_concentration === 'High' ? 'red' : 'green'}">
                <div class="profile-stat-label">Concentration</div>
                <div class="profile-stat-value">${data.portfolio_concentration}</div>
              </div>
            </div>

            <div class="profile-total-value">
              <div class="profile-total-label">Estimated Smart Money Value</div>
              <div class="profile-total-amount">
                <span class="profile-total-currency">Rp</span>${(data.portfolio_value / (data.portfolio_value >= 1000000000000 ? 1000000000000 : 1000000000)).toFixed(2)}
                <span class="profile-total-suffix">${data.portfolio_value >= 1000000000000 ? 'Triliun' : 'Miliar'}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-analytics-grid" style="display: grid; grid-template-columns: 1.5fr 1fr; border-bottom: 1px solid rgba(0,0,0,0.05);">
          <div class="profile-insight-box" style="padding: 3rem; background: white; border-right: 1px solid rgba(0,0,0,0.05);">
            <h3 style="text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; color: var(--gold-500); margin-bottom: 1rem;">Smart Money Insights</h3>
            <p style="font-size: 1.1rem; line-height: 1.6; color: var(--navy-800); font-weight: 500;">
              Investor <strong>${investorName}</strong> memiliki portofolio sebesar <strong>${formatIDRCurrency(data.portfolio_value)}</strong> dengan 
              konsentrasi <strong>${data.portfolio_concentration.toLowerCase()}</strong> pada saham <strong>${data.largest_holding}</strong>.
              ${data.influence_score > 10000000000000 ? 'Memiliki pengaruh signifikan terhadap pergerakan pasar di sektor terkait.' : 'Bertindak sebagai investor strategis dengan fokus pada pertumbuhan jangka panjang.'}
            </p>
            <div style="margin-top: 2rem; display: flex; gap: 1rem;">
               <div class="lf-badge ${first.local_foreign === 'L' ? 'lf-local' : 'lf-asing'}">${first.local_foreign === 'L' ? 'Lokal' : 'Asing'}</div>
               <div class="lf-badge lf-other">${scriplessPct}% Scripless</div>
            </div>
          </div>
          <div class="profile-chart-box" style="padding: 2rem; background: #fffcf5; display: flex; align-items: center; justify-content: center; flex-direction: column;">
             <h3 style="text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 1rem;">Portfolio Allocation</h3>
             <div style="width: 100%; max-height: 200px; display: flex; justify-content: center;">
                <canvas id="allocationChart"></canvas>
             </div>
          </div>
        </div>

        <div class="profile-holdings">
          <h2 style="font-size: 1.25rem; font-weight: 900; margin-bottom: 2rem; color: var(--navy-900);">Detailed Holdings Disclosure</h2>
          <div class="holdings-list">
            ${holdings.map((h, i) => `
              <div class="premium-holding-item" style="border-left: 4px solid ${i === 0 ? 'var(--gold-500)' : 'var(--navy-500)'}">
                <div class="ph-rank">#${h.shareholder_rank}</div>
                <div class="ph-info">
                  <div class="ph-code" style="cursor:pointer" onclick="showIssuerDetail('${h.share_code}', '${(h.issuer_name || '').replace(/'/g, "\\'")}')">${h.share_code}</div>
                  <div class="ph-details" style="cursor:pointer" onclick="showIssuerDetail('${h.share_code}', '${(h.issuer_name || '').replace(/'/g, "\\'")}')">${h.issuer_name || '—'}</div>
                  <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--navy-800);">
                      ${h.price > 0 ? `Rp ${h.price.toLocaleString('id-ID')}` : '<span style="color:var(--text-muted); font-style:italic;">Harga tidak tersedia</span>'}
                    </span>
                    ${h.price > 0 ? `
                    <span style="font-size: 0.7rem; font-weight: 800; color: ${h.change_percent >= 0 ? 'var(--green)' : 'var(--red)'}">
                      ${h.change_percent >= 0 ? '▲' : '▼'} ${Math.abs(h.change_percent).toFixed(2)}%
                    </span>
                    ` : ''}
                  </div>
                  <div style="margin-top: 0.5rem; font-size: 0.7rem; color: var(--text-muted);">
                    <div style="display: flex; gap: 1rem;">
                      <span>Scripless: <strong>${Number(h.holdings_scripless || 0).toLocaleString('id-ID')}</strong></span>
                      <span>Scrip: <strong>${Number(h.holdings_scrip || 0).toLocaleString('id-ID')}</strong></span>
                    </div>
                  </div>
                  <div style="margin-top: 0.25rem; font-size: 0.65rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; cursor: pointer;" onclick="showKonglomeratDetailByName('${h.conglomerate}')">Group: ${h.conglomerate}</div>
                </div>
                <div class="ph-value-wrap">
                  <div class="ph-value">${h.percentage}%</div>
                  <div class="ph-details">Allocation: ${h.allocation}</div>
                  <div class="ph-details">${formatIDRCurrency(parseFloat(h.market_value))}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div style="margin-top: 2rem; padding: 1rem; background: var(--navy-50); border-radius: 8px; border-left: 4px solid var(--navy-300); font-size: 0.8rem; color: var(--navy-700);">
        <strong>Catatan:</strong> Saham dengan "Allocation 0.00%" biasanya disebabkan karena harga pasar belum tersedia dalam sistem (Saham Suspensi, Delisted, atau baru saja terdaftar) sehingga Nilai Pasar belum bisa dikalkulasi.
      </div>
    `;

    // Initialize Chart
    const ctx = document.getElementById('allocationChart').getContext('2d');
    const allocationData = holdings.map(h => parseFloat(h.allocation));
    const labels = holdings.map(h => h.share_code);
    
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: allocationData,
          backgroundColor: [
            '#1a365d', '#d4af37', '#2d5a27', '#8b0000', '#4a5568', '#2c5282', '#975a16'
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.raw.toFixed(2)}%`;
              }
            }
          }
        },
        cutout: '70%',
        responsive: true,
        maintainAspectRatio: false
      }
    });

  } catch (err) {
    console.error('Profile Load Error:', err);
    container.innerHTML = `<div class="panel" style="padding: 3rem; color: var(--red);">Error retrieving disclosure data. Please try again later.</div>`;
    container.classList.remove('loading');
  }
};
