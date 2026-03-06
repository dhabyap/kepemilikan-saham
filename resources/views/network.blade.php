<!DOCTYPE html>
<html lang="id">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ownership Network Graph | Stock Disclosure Monitoring</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('style.css') }}">
  <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
  <style>
    /* Inline overrides for network graph */
    .graph-controls {
      max-width: 1700px;
      margin: 0 auto;
      padding: 1.5rem 1.5rem 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .graph-controls h2 {
      font-size: 1rem;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .graph-search-wrap {
      width: 100%;
      max-width: 100%;
      display: flex;
      background: white;
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    .select2-container--default .select2-selection--single {
      border: none !important;
      height: 48px !important;
      line-height: 48px !important;
      display: flex !important;
      align-items: center !important;
    }

    .select2-selection__rendered {
      font-size: 0.9rem !important;
      padding-left: 1rem !important;
    }

    .select2-selection__arrow {
      height: 48px !important;
    }

    .graph-container {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1.5rem;
      max-width: 1700px;
      margin: 0 auto;
      padding: 1.5rem 2.5rem 4rem;
    }

    #networkCanvas {
      width: 100%;
      height: 700px;
      background: white;
      border: 1px solid var(--border);
      border-radius: 12px;
      position: relative;
    }

    .graph-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .sidebar-card {
      background: white;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .sidebar-card h4 {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .graph-legend {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.85rem;
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .graph-canvas-header {
      position: absolute;
      top: 1.5rem;
      left: 1.5rem;
      right: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
      pointer-events: none;
    }

    .canvas-title {
      background: rgba(255, 255, 255, 0.9);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: 1px solid var(--border);
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .investor-chip {
      padding: 1rem;
      background: linear-gradient(135deg, #1e293b, #0f172a);
      color: white;
      border-radius: 8px;
      cursor: pointer;
      margin-bottom: 0.5rem;
      transition: transform 0.2s;
    }

    .investor-chip:hover {
      transform: translateX(5px);
    }

    .investor-chip .name {
      font-weight: 700;
      font-size: 0.85rem;
      line-height: 1.2;
    }

    .investor-chip .meta {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.55);
      margin-top: 0.4rem;
    }

    @media (max-width: 1000px) {
      .graph-container {
        grid-template-columns: 1fr;
        padding: 0 1.5rem 2rem;
      }

      #networkCanvas {
        height: 400px;
      }

      .graph-controls {
        padding: 1.5rem 1.5rem 0;
      }
    }

    @media (max-width: 600px) {
      .graph-canvas-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      #networkCanvas {
        height: 350px;
      }

      .graph-legend {
        flex-wrap: wrap;
        gap: 0.5rem 1rem;
      }
    }
  </style>
</head>

<body style="background: #f8fafc;">

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
        <a href="{{ url('/network.html') }}" class="nav-link active">🔗 Network Graph</a>
      </div>
    </nav>
  </header>

  <div class="graph-controls">
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <div style="padding: 0.5rem; background: var(--gold-100); border-radius: 8px;">📊</div>
      <div>
        <h2 style="margin:0; font-size: 1.25rem; color: var(--text-main); font-weight: 800;">Ownership Intelligence
          Network</h2>
        <p style="margin:0; font-size: 0.75rem; color: var(--text-muted);">Visualizing connections between major
          institutional investors and Indonesian issuers</p>
      </div>
    </div>
    <div class="graph-search-wrap">
      <select id="investorSelect" style="width: 100%;">
        <option value="">Search for an investor (e.g. BlackRock, Government of Singapore, Low Tuck Kwong...)</option>
      </select>
    </div>
  </div>

  <div class="graph-container">
    <div id="networkCanvas">
      <div class="graph-canvas-header">
        <div id="activeNodeInfo" class="canvas-title">Select a node to inspect connections</div>
        <div style="display: flex; gap: 0.5rem; pointer-events: auto;">
          <button class="btn btn-ghost" style="padding: 0.4rem 0.8rem; font-size: 0.7rem;" onclick="resetZoom()">Reset
            View</button>
        </div>
      </div>
      <!-- Vis-network will render here -->
    </div>

    <div class="graph-sidebar">
      <div class="sidebar-card">
        <h4>Legend</h4>
        <div class="graph-legend">
          <div class="legend-item">
            <div class="dot" style="background: #e85d26;"></div> <span>Target Investor</span>
          </div>
          <div class="legend-item">
            <div class="dot" style="background: #3b82f6;"></div> <span>Issuer (Stock)</span>
          </div>
          <div class="legend-item">
            <div class="dot" style="background: #94a3b8;"></div> <span>Peer Investor (&gt;5%)</span>
          </div>
        </div>
      </div>

      <div class="sidebar-card">
        <h4>Quick Explore</h4>
        <div id="quickInvestors">
          <div class="investor-chip" onclick="loadNetwork('LOW TUCK KWONG')">
            <div class="name">LOW TUCK KWONG</div>
            <div class="meta">Major Majority Holder (BYAN)</div>
          </div>
          <div class="investor-chip" onclick="loadNetwork('GOVERNMENT OF NORWAY')">
            <div class="name">GOVERNMENT OF NORWAY</div>
            <div class="meta">NBIM Sovereign Wealth Fund</div>
          </div>
          <div class="investor-chip" onclick="loadNetwork('FIDELITY FUNDS')">
            <div class="name">FIDELITY FUNDS</div>
            <div class="meta">Global Asset Management</div>
          </div>
        </div>
      </div>

      <div class="sidebar-card" id="nodeSummaryCard" style="display:none;">
        <h4 id="nodeSummaryTitle">Node Details</h4>
        <div id="nodeSummaryContent" style="font-size: 0.8rem; color: var(--text-main);"></div>
      </div>
    </div>
  </div>

  <script src="{{ asset('app.js') }}"></script>
  <script>
    let network = null;
    let nodes = new vis.DataSet([]);
    let edges = new vis.DataSet([]);

    $(document).ready(function () {
      $('#investorSelect').select2({
        ajax: {
          url: '/api/investors/search',
          dataType: 'json',
          delay: 250,
          data: function (params) { return { q: params.term }; },
          processResults: function (data) {
            return {
              results: data.map(item => ({ id: item.investor_name, text: item.investor_name }))
            };
          },
          cache: true
        },
        minimumInputLength: 3
      });

      $('#investorSelect').on('select2:select', function (e) {
        loadNetwork(e.params.data.id);
      });

      initNetwork();
    });

    function initNetwork() {
      const container = document.getElementById('networkCanvas');
      const data = { nodes: nodes, edges: edges };
      const options = {
        nodes: {
          shape: 'dot',
          size: 25,
          font: { size: 12, face: 'Inter', color: '#1e293b' },
          borderWidth: 2,
          shadow: true
        },
        edges: {
          width: 2,
          color: { color: '#cbd5e1', highlight: '#3b82f6' },
          smooth: { type: 'continuous' }
        },
        physics: {
          stabilization: true,
          barnesHut: { gravitationalConstant: -3000, springLength: 150 }
        },
        interaction: { hover: true, tooltipDelay: 200 }
      };
      network = new vis.Network(container, data, options);

      network.on("click", function (params) {
        if (params.nodes.length > 0) {
          showNodeInfo(params.nodes[0]);
        }
      });
    }

    async function loadNetwork(investorName) {
      nodes.clear();
      edges.clear();
      $('#activeNodeInfo').text(`Mapping connections for: ${investorName}`);

      try {
        const resp = await fetch(`/api/investor-network?investor=${encodeURIComponent(investorName)}`);
        const data = await resp.json();

        // Root Investor
        nodes.add({
          id: 'root',
          label: investorName,
          color: '#e85d26',
          size: 40,
          font: { weight: 'bold', size: 16 }
        });

        // Holdings
        data.holdings.forEach(h => {
          nodes.add({
            id: h.share_code,
            label: h.share_code,
            title: h.issuer_name,
            color: '#3b82f6',
          });
          edges.add({ from: 'root', to: h.share_code, label: `${h.percentage}%` });
        });

        // Peers
        const shareToPeers = {};
        data.peers.forEach(p => {
          if (!shareToPeers[p.share_code]) shareToPeers[p.share_code] = [];
          shareToPeers[p.share_code].push(p);
        });

        Object.keys(shareToPeers).forEach(code => {
          shareToPeers[code].forEach(p => {
            const peerId = `p_${p.investor_name}`;
            if (!nodes.get(peerId)) {
              nodes.add({
                id: peerId,
                label: p.investor_name,
                color: '#94a3b8',
                size: 20
              });
            }
            edges.add({ from: peerId, to: code, dashes: true });
          });
        });

        network.fit();
      } catch (err) {
        console.error(err);
      }
    }

    function showNodeInfo(nodeId) {
      const node = nodes.get(nodeId);
      $('#nodeSummaryCard').show();
      $('#nodeSummaryTitle').text(node.label);
      let html = `<p>Type: ${nodeId.startsWith('p_') ? 'Peer Investor' : (nodeId === 'root' ? 'Target Investor' : 'Equity/Issuer')}</p>`;
      if (node.title) html += `<p>Company: <strong>${node.title}</strong></p>`;
      $('#nodeSummaryContent').html(html);
    }

    function resetZoom() { if (network) network.fit(); }
  </script>
</body>

</html>