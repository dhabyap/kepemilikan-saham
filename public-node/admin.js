document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // --- Auth Verification ---
  try {
    const res = await fetch('/api/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Token invalid');
    // If valid, show the page
    document.body.style.display = 'block';
  } catch (err) {
    console.error('Auth verify error:', err);
    localStorage.removeItem('adminToken');
    window.location.href = '/login.html';
    return;
  }

  // --- Global Setup ---
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // --- Logout ---
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/login.html';
  });

  // --- Tabs Navigation ---
  const tabBtns = document.querySelectorAll('.menu-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      // Add active to current
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');

      // Auto-load data when switching tabs
      if (btn.dataset.tab === 'tab-saham') loadSahamData();
      if (btn.dataset.tab === 'tab-konglomerat') loadKonglomeratData();
    });
  });

  // --- Upload PDF Tab ---
  const fileDropArea = document.getElementById('fileDropArea');
  const fileInput = document.getElementById('pdfFileInput');
  const selectedFileName = document.getElementById('selectedFileName');
  const uploadForm = document.getElementById('uploadForm');
  const uploadBtn = document.getElementById('uploadBtn');
  const uploadStatus = document.getElementById('uploadStatus');

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileDropArea.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    fileDropArea.addEventListener(eventName, () => fileDropArea.classList.add('dragover'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    fileDropArea.addEventListener(eventName, () => fileDropArea.classList.remove('dragover'), false);
  });

  fileDropArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      fileInput.files = files;
      selectedFileName.textContent = files[0].name;
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      selectedFileName.textContent = fileInput.files[0].name;
    }
  });

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = fileInput.files[0];
    
    if (!file) {
      uploadStatus.innerHTML = '<span style="color:var(--accent-rose)">Pilih file PDF terlebih dahulu!</span>';
      return;
    }

    const formData = new FormData();
    formData.append('pdfFile', file);

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = 'Memproses Extraction... 🔄';
    uploadStatus.innerHTML = '<span style="color:var(--text-muted)">Sedang mengekstrak data JSON menggunakan AI. Proses ini bisa memakan waktu hingga beberapa menit. Tolong jangan tutup halaman ini.</span>';

    try {
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` 
        },
        body: formData 
      });

      const result = await response.json();

      if (response.ok) {
        uploadStatus.innerHTML = `<span style="color:var(--accent-emerald)">Berhasil: ${result.message}</span>`;
        fileInput.value = '';
        selectedFileName.textContent = '';
      } else {
        throw new Error(result.error + ": " + (result.details || ''));
      }
    } catch (error) {
      uploadStatus.innerHTML = `<span style="color:var(--accent-rose)">Gagal: ${error.message}</span>`;
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = '🚀 Upload & Timpa Data Lama';
    }
  });


  // ==========================================
  // TAB: KELOLA DATA SAHAM (CRUD)
  // ==========================================
  const sahamTableBody = document.getElementById('sahamTableBody');
  const sahamEditForm = document.getElementById('sahamEditForm');

  async function loadSahamData() {
    sahamTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading data...</td></tr>';
    try {
      // Fetch latest top 100 for admin view 
      const res = await fetch('/api/search?q=', { headers });
      const data = await res.json();
      
      sahamTableBody.innerHTML = '';
      if (!data || data.length === 0) {
         sahamTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Tidak ada data ditemukan.</td></tr>';
         return;
      }

      data.slice(0, 100).forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="code-cell">${item.share_code}</td>
          <td class="name-cell">${item.investor_name}</td>
          <td class="number-cell">${Number(item.total_holding_shares).toLocaleString('id-ID')}</td>
          <td class="pct-cell">${item.percentage}%</td>
          <td>
            <div class="action-group">
              <button class="btn-icon edit" onclick='openSahamEdit(${JSON.stringify(item)})' title="Edit">✏️</button>
              <button class="btn-icon delete" onclick="deleteSaham('${item.id}')" title="Hapus">🗑️</button>
            </div>
          </td>
        `;
        sahamTableBody.appendChild(tr);
      });
    } catch (err) {
      sahamTableBody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Error: ${err.message}</td></tr>`;
    }
  }

  // Expose to window for inline onclick HTML
  window.openSahamEdit = (item) => {
    document.getElementById('editSahamId').value = item.id;
    document.getElementById('editSahamCode').value = item.share_code;
    document.getElementById('editSahamIssuer').value = item.issuer_name || '';
    document.getElementById('editSahamInvestor').value = item.investor_name;
    document.getElementById('editSahamType').value = item.investor_type || '';
    document.getElementById('editSahamLA').value = item.local_foreign || '';
    document.getElementById('editSahamShares').value = item.total_holding_shares;
    document.getElementById('editSahamPct').value = item.percentage;
    
    document.getElementById('sahamModal').classList.add('active');
  };

  window.deleteSaham = async (id) => {
    if(!confirm('Apakah Anda yakin ingin menghapus data saham ini secara permanen?')) return;
    try {
      const res = await fetch(`/api/saham/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        loadSahamData();
      } else {
        const err = await res.json();
        alert('Gagal menghapus: ' + err.error);
      }
    } catch(e) {
      console.error(e);
      alert('Terjadi kesalahan koneksi.');
    }
  };

  sahamEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editSahamId').value;
    const bodyArgs = {
      share_code: document.getElementById('editSahamCode').value.toUpperCase(),
      issuer_name: document.getElementById('editSahamIssuer').value,
      investor_name: document.getElementById('editSahamInvestor').value,
      investor_type: document.getElementById('editSahamType').value.toUpperCase(),
      local_foreign: document.getElementById('editSahamLA').value.toUpperCase(),
      total_holding_shares: document.getElementById('editSahamShares').value,
      percentage: document.getElementById('editSahamPct').value,
    };

    try {
      const res = await fetch(`/api/saham/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(bodyArgs)
      });
      if (res.ok) {
        closeModal('sahamModal');
        loadSahamData();
      } else {
        const err = await res.json();
        alert('Gagal menyimpan: ' + err.error);
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    }
  });


  // ==========================================
  // TAB: KELOLA KONGLOMERAT (CRUD)
  // ==========================================
  const konglomeratTableBody = document.getElementById('konglomeratTableBody');
  const konglomeratForm = document.getElementById('konglomeratForm');
  const addKonglomeratBtn = document.getElementById('addKonglomeratBtn');

  async function loadKonglomeratData() {
    konglomeratTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading data...</td></tr>';
    try {
      const res = await fetch('/api/konglomerat', { headers });
      const data = await res.json();
      
      konglomeratTableBody.innerHTML = '';
      if (!data || data.length === 0) {
         konglomeratTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Tidak ada data konglomerat.</td></tr>';
         return;
      }

      data.forEach(item => {
        const stocksStr = item.stocks.join(', ');
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="name-cell">${item.nama}</td>
          <td>${item.nama_grup || '-'}</td>
          <td><span class="code-cell">${stocksStr}</span></td>
          <td>
            <div class="action-group">
              <button class="btn-icon edit" onclick='openKonglomeratForm(${JSON.stringify(item)})' title="Edit">✏️</button>
              <button class="btn-icon delete" onclick="deleteKonglomerat('${item.id}')" title="Hapus">🗑️</button>
            </div>
          </td>
        `;
        konglomeratTableBody.appendChild(tr);
      });
    } catch (err) {
      konglomeratTableBody.innerHTML = `<tr><td colspan="4" style="color:red; text-align:center;">Error: ${err.message}</td></tr>`;
    }
  }

  addKonglomeratBtn.addEventListener('click', () => {
    document.getElementById('konglomeratModalTitle').textContent = 'Tambah Konglomerat';
    document.getElementById('formKonglomeratId').value = '';
    konglomeratForm.reset();
    document.getElementById('konglomeratModal').classList.add('active');
  });

  window.openKonglomeratForm = (item) => {
    document.getElementById('konglomeratModalTitle').textContent = 'Edit Profil Konglomerat';
    document.getElementById('formKonglomeratId').value = item.id;
    document.getElementById('konglomeratNama').value = item.nama;
    document.getElementById('konglomeratGrup').value = item.nama_grup || '';
    document.getElementById('konglomeratStocks').value = item.stocks.join(', ');
    document.getElementById('konglomeratSector').value = (item.sector || []).join(', ');
    document.getElementById('konglomeratRole').value = item.role || 'Ultimate Beneficial Owner';
    
    document.getElementById('konglomeratModal').classList.add('active');
  };

  window.deleteKonglomerat = async (id) => {
    if(!confirm('Yakin ingin menghapus profil ini?')) return;
    try {
      const res = await fetch(`/api/konglomerat/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        loadKonglomeratData();
      } else {
        alert('Gagal menghapus.');
      }
    } catch(e) {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  konglomeratForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('formKonglomeratId').value;
    
    const bodyArgs = {
      nama: document.getElementById('konglomeratNama').value.trim(),
      nama_grup: document.getElementById('konglomeratGrup').value.trim(),
      stocks: document.getElementById('konglomeratStocks').value.split(',').map(s => s.trim().toUpperCase()).filter(s => s),
      sector: document.getElementById('konglomeratSector').value.split(',').map(s => s.trim()).filter(s => s),
      role: document.getElementById('konglomeratRole').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/konglomerat/${id}` : '/api/konglomerat';

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(bodyArgs)
      });
      if (res.ok) {
        closeModal('konglomeratModal');
        loadKonglomeratData();
      } else {
        const err = await res.json();
        alert('Gagal menyimpan: ' + err.error);
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    }
  });

  // Global Modal Close Function
  window.closeModal = (id) => {
    document.getElementById(id).classList.remove('active');
  };

});
