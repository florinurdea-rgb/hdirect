(function () {
  'use strict';

  // ============================================================
  // DATA
  // ============================================================
  const TRADES = [
    { id: 'handyman',    name: 'Handyman',    icon: '🔨' },
    { id: 'plumber',     name: 'Plumber',     icon: '🔧' },
    { id: 'electrician', name: 'Electrician', icon: '⚡' },
    { id: 'decorator',   name: 'Decorator',   icon: '🎨' },
    { id: 'builder',     name: 'Builder',     icon: '🏗️' },
  ];

  // trades[id] = slots TAKEN (0 = fully open, 3 = full)
  const BOROUGHS = [
    { id: 'barnet',        name: 'Barnet',         zone: 'Zone 3–5 · North London',    x: 208, y: 62,
      trades: { handyman: 2, plumber: 3, electrician: 1, decorator: 2, builder: 0 } },
    { id: 'camden',        name: 'Camden',         zone: 'Zone 1–2 · North London',    x: 246, y: 100,
      trades: { handyman: 1, plumber: 2, electrician: 2, decorator: 3, builder: 1 } },
    { id: 'islington',     name: 'Islington',      zone: 'Zone 1–2 · North London',    x: 286, y: 112,
      trades: { handyman: 2, plumber: 1, electrician: 3, decorator: 2, builder: 2 } },
    { id: 'hackney',       name: 'Hackney',        zone: 'Zone 2 · East London',       x: 332, y: 106,
      trades: { handyman: 1, plumber: 3, electrician: 2, decorator: 3, builder: 3 } },
    { id: 'tower-hamlets', name: 'Tower Hamlets',  zone: 'Zone 1–2 · East London',     x: 350, y: 155,
      trades: { handyman: 2, plumber: 3, electrician: 2, decorator: 1, builder: 3 } },
    { id: 'westminster',   name: 'Westminster',    zone: 'Zone 1 · Central London',    x: 256, y: 162,
      trades: { handyman: 3, plumber: 3, electrician: 3, decorator: 3, builder: 3 } },
    { id: 'kensington',    name: 'Kensington',     zone: 'Zone 1–2 · West London',     x: 212, y: 168,
      trades: { handyman: 3, plumber: 2, electrician: 3, decorator: 3, builder: 2 } },
    { id: 'hammersmith',   name: 'Hammersmith',    zone: 'Zone 2 · West London',       x: 168, y: 194,
      trades: { handyman: 1, plumber: 2, electrician: 1, decorator: 2, builder: 1 } },
    { id: 'ealing',        name: 'Ealing',         zone: 'Zone 3 · West London',       x: 124, y: 156,
      trades: { handyman: 0, plumber: 1, electrician: 0, decorator: 1, builder: 0 } },
    { id: 'wandsworth',    name: 'Wandsworth',     zone: 'Zone 2–3 · South West',      x: 226, y: 238,
      trades: { handyman: 3, plumber: 2, electrician: 2, decorator: 3, builder: 2 } },
    { id: 'lambeth',       name: 'Lambeth',        zone: 'Zone 1–2 · South London',    x: 272, y: 232,
      trades: { handyman: 2, plumber: 1, electrician: 2, decorator: 2, builder: 1 } },
    { id: 'southwark',     name: 'Southwark',      zone: 'Zone 1–2 · South East',      x: 314, y: 218,
      trades: { handyman: 1, plumber: 3, electrician: 2, decorator: 2, builder: 3 } },
    { id: 'lewisham',      name: 'Lewisham',       zone: 'Zone 2–3 · South East',      x: 350, y: 248,
      trades: { handyman: 0, plumber: 2, electrician: 1, decorator: 0, builder: 2 } },
    { id: 'greenwich',     name: 'Greenwich',      zone: 'Zone 2–3 · South East',      x: 402, y: 232,
      trades: { handyman: 1, plumber: 1, electrician: 0, decorator: 1, builder: 1 } },
    { id: 'richmond',      name: 'Richmond',       zone: 'Zone 4 · South West',        x: 154, y: 252,
      trades: { handyman: 3, plumber: 3, electrician: 3, decorator: 3, builder: 3 } },
    { id: 'croydon',       name: 'Croydon',        zone: 'Zone 4–5 · South London',    x: 294, y: 310,
      trades: { handyman: 0, plumber: 1, electrician: 0, decorator: 0, builder: 1 } },
  ];

  function statusFromTaken(taken) {
    if (taken <= 0) return 'open';
    if (taken === 1) return 'limited';
    if (taken === 2) return 'scarce';
    return 'full';
  }

  function nodeColor(borough, tradeFilter) {
    let vals;
    if (tradeFilter && tradeFilter !== 'all') {
      vals = [borough.trades[tradeFilter] ?? 0];
    } else {
      vals = Object.values(borough.trades);
    }
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg >= 2.6) return { fill: '#ef4444', glow: 'rgba(239,68,68,0.5)' };
    if (avg >= 1.6) return { fill: '#f59e0b', glow: 'rgba(245,158,11,0.5)' };
    if (avg >= 0.6) return { fill: '#38bdf8', glow: 'rgba(56,189,248,0.5)' };
    return { fill: '#22c55e', glow: 'rgba(34,197,94,0.5)' };
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  // ============================================================
  // RENDER MAP NODES
  // ============================================================
  let activeFilter = 'all';

  function renderNodes(groupId, mini) {
    const g = document.getElementById(groupId);
    if (!g) return;
    g.innerHTML = '';
    BOROUGHS.forEach((b, i) => {
      const { fill, glow } = nodeColor(b, activeFilter);
      const r = mini ? 6 : 11;
      const group = svgEl('g', { class: 'borough-node', 'data-id': b.id });

      // Pulse ring (only full map)
      if (!mini) {
        const pulse = svgEl('circle', { cx: b.x, cy: b.y, r: '13', fill: fill, opacity: '0', class: 'node-pulse' });
        pulse.style.animationDelay = (i * 0.28) + 's';
        group.appendChild(pulse);
        // Selection ring placeholder
        group.appendChild(svgEl('circle', { cx: b.x, cy: b.y, r: String(r + 5), fill: 'none', stroke: 'transparent', 'stroke-width': '2', class: 'node-ring' }));
      }

      // Main circle
      const circle = svgEl('circle', { cx: b.x, cy: b.y, r: String(r), fill: fill, class: 'node-bg' });
      circle.style.filter = `drop-shadow(0 0 7px ${glow})`;
      group.appendChild(circle);

      // Inner dot
      group.appendChild(svgEl('circle', { cx: b.x, cy: b.y, r: String(mini ? 2 : 4), fill: 'rgba(0,0,0,0.45)' }));

      // Label (full map only)
      if (!mini) {
        const txt = svgEl('text', {
          x: b.x, y: String(b.y + 21), 'text-anchor': 'middle',
          fill: 'rgba(160,176,196,0.85)', 'font-size': '8.5',
          'font-family': 'Inter,sans-serif', 'font-weight': '600', class: 'node-label'
        });
        txt.textContent = b.name;
        group.appendChild(txt);
        group.addEventListener('click', () => selectBorough(b));
      }

      g.appendChild(group);
    });
  }

  function updateNodeColors() {
    BOROUGHS.forEach(b => {
      const group = document.querySelector(`#boroughNodes [data-id="${b.id}"]`);
      if (!group) return;
      const { fill, glow } = nodeColor(b, activeFilter);
      const circle = group.querySelector('.node-bg');
      if (circle) {
        circle.setAttribute('fill', fill);
        circle.style.filter = `drop-shadow(0 0 7px ${glow})`;
      }
      const pulse = group.querySelector('.node-pulse');
      if (pulse) pulse.setAttribute('fill', fill);
    });
  }

  // ============================================================
  // AREA DETAIL PANEL
  // ============================================================
  function selectBorough(b) {
    // Deselect all
    document.querySelectorAll('#boroughNodes .borough-node').forEach(n => n.classList.remove('selected'));
    const node = document.querySelector(`#boroughNodes [data-id="${b.id}"]`);
    if (node) node.classList.add('selected');
    renderPanel(b);
  }

  function renderPanel(b) {
    const panel = document.getElementById('areaDetailPanel');
    if (!panel) return;

    const rows = TRADES.map(t => {
      const taken = b.trades[t.id] ?? 0;
      const avail = 3 - taken;
      const status = statusFromTaken(taken);
      const dots = Array.from({ length: 3 }, (_, i) => {
        const isTaken = i < taken;
        return `<span class="slot-dot ${isTaken ? 'taken' : 'avail' + (avail === 1 ? ' scarce' : '')}"></span>`;
      }).join('');
      const badge = {
        open:    `<span class="trade-status s-open">Open</span>`,
        limited: `<span class="trade-status s-limited">Limited</span>`,
        scarce:  `<span class="trade-status s-scarce">1 left!</span>`,
        full:    `<span class="trade-status s-full">Full</span>`,
      }[status];
      return `<div class="trade-row">
        <span class="trade-icon">${t.icon}</span>
        <div class="trade-info">
          <span class="trade-name">${t.name}</span>
          <div class="trade-slots">${dots}</div>
        </div>
        ${badge}
      </div>`;
    }).join('');

    panel.innerHTML = `
      <div class="area-detail-name">${b.name}</div>
      <div class="area-detail-zone">${b.zone}</div>
      ${rows}
      <a href="#join-pro" class="btn primary panel-cta">Claim a spot here →</a>
    `;
  }

  // ============================================================
  // AVAILABILITY TABLE
  // ============================================================
  function renderAvailTable() {
    const el = document.getElementById('availabilityRows');
    if (!el) return;
    const rows = BOROUGHS.map(b => {
      const cells = ['handyman', 'plumber', 'electrician', 'decorator', 'builder'].map(tid => {
        const taken = b.trades[tid] ?? 0;
        const avail = 3 - taken;
        const s = statusFromTaken(taken);
        const label = s === 'open' ? `${avail} open` : s === 'limited' ? `${avail} left` : s === 'scarce' ? '1 left!' : 'Full';
        return `<div class="avail-cell"><span class="avail-badge ${s}">${label}</span></div>`;
      }).join('');
      return `<div class="avail-row"><div class="avail-borough">${b.name}</div>${cells}</div>`;
    }).join('');
    el.innerHTML = rows;
  }

  // ============================================================
  // ACTIVITY FEED
  // ============================================================
  const EVENTS = [
    { icon: '🔧', text: '<strong>Marcus T.</strong> (Plumber) joined <strong>Hackney</strong> — 2 spots remain', time: '2 min ago' },
    { icon: '📋', text: 'New job posted: <strong>Bathroom sink repair</strong> in <strong>Islington</strong>', time: '5 min ago' },
    { icon: '⚡', text: '<strong>Sarah K.</strong> (Electrician) claimed a spot in <strong>Wandsworth</strong>', time: '11 min ago' },
    { icon: '✅', text: 'Job completed: <strong>Full bathroom refurb</strong> in <strong>Kensington</strong>', time: '18 min ago' },
    { icon: '📋', text: 'New job posted: <strong>Garden landscaping & decking</strong> in <strong>Richmond</strong>', time: '24 min ago' },
    { icon: '🎨', text: '<strong>David O.</strong> (Decorator) claimed last spot in <strong>Richmond</strong> — now FULL', time: '31 min ago' },
    { icon: '📋', text: 'New job posted: <strong>Boiler replacement</strong> in <strong>Tower Hamlets</strong>', time: '38 min ago' },
    { icon: '🔨', text: '<strong>Ali M.</strong> (Handyman) joined <strong>Southwark</strong> — 2 spots remain', time: '45 min ago' },
  ];

  function renderActivity() {
    const el = document.getElementById('activityFeed');
    if (!el) return;
    el.innerHTML = EVENTS.map(e =>
      `<div class="activity-item">
         <span class="activity-icon">${e.icon}</span>
         <span class="activity-text">${e.text}</span>
         <span class="activity-time">${e.time}</span>
       </div>`
    ).join('');
  }

  // ============================================================
  // TICKER
  // ============================================================
  const TICKER = [
    'Marcus T. (Plumber) joined Hackney · 2 spots left',
    'New job: Kitchen renovation in Camden',
    'David O. claimed last Decorator spot in Richmond — now FULL',
    'New job: Boiler repair in Tower Hamlets',
    'Sarah K. (Electrician) joined Wandsworth',
    'Westminster is now FULL for all trades',
    'New job: Full flat refurb in Southwark',
    'Ali M. (Handyman) joined Lewisham · 1 spot left',
  ];
  let tickerIdx = 0;

  function rotateTicker() {
    const el = document.getElementById('tickerText');
    if (!el) return;
    tickerIdx = (tickerIdx + 1) % TICKER.length;
    el.style.transition = 'opacity .25s';
    el.style.opacity = '0';
    setTimeout(() => { el.textContent = TICKER[tickerIdx]; el.style.opacity = '1'; }, 260);
  }

  // ============================================================
  // HOW TABS
  // ============================================================
  function initHowTabs() {
    document.querySelectorAll('.how-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.how-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isClients = tab.dataset.tab === 'clients';
        document.getElementById('howStepsClients').classList.toggle('hidden', !isClients);
        document.getElementById('howStepsPros').classList.toggle('hidden', isClients);
      });
    });
  }

  // ============================================================
  // TRADE FILTERS
  // ============================================================
  function initTradeFilters() {
    document.querySelectorAll('.trade-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.trade-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.trade;
        updateNodeColors();
      });
    });
  }

  // ============================================================
  // FORMS + TOAST
  // ============================================================
  function toast(html) {
    const t = document.createElement('div');
    t.innerHTML = html;
    Object.assign(t.style, {
      position: 'fixed', bottom: '24px', right: '24px',
      padding: '14px 18px', background: '#0f1622',
      border: '1px solid #1a2535', color: '#e8edf5',
      borderRadius: '14px', zIndex: '9999',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      fontSize: '.88rem', maxWidth: '320px',
      animation: 'slideIn .3s ease',
    });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  ['client-form', 'pro-form'].forEach(id => {
    const f = document.getElementById(id);
    if (!f) return;
    f.addEventListener('submit', () => {
      const data = Object.fromEntries(new FormData(f).entries());
      localStorage.setItem(id, JSON.stringify({ data, at: new Date().toISOString() }));
      if (id === 'client-form') {
        toast('✓ <strong>Job posted!</strong> We\'ll match you with local pros shortly.');
      } else {
        toast('✓ <strong>Application received!</strong> We\'ll review and be in touch within 48 hours.');
      }
      f.reset();
    });
  });

  // ============================================================
  // INIT
  // ============================================================
  document.getElementById('year').textContent = new Date().getFullYear();

  renderNodes('boroughNodes', false);
  renderNodes('heroNodes', true);
  renderAvailTable();
  renderActivity();
  initHowTabs();
  initTradeFilters();

  setInterval(rotateTicker, 3200);

  // Subtle live count animation
  const liveEl = document.getElementById('liveCount');
  if (liveEl) {
    setInterval(() => {
      const n = 44 + Math.floor(Math.random() * 8);
      liveEl.textContent = n + ' pros';
    }, 7000);
  }

})();
