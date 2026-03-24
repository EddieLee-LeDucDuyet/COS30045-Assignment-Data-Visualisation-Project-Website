/* ============================================================
   main.js — App bootstrap, tab switching, control bindings
   Depends on: config.js, tooltip.js, data.js, charts.js
   ============================================================ */

const FILTER_CHECKBOX_FIELDS = [
  'JURISDICTION',
  'LOCATION',
  'METRIC',
  'DETECTION_METHOD',
  'DETECTION_GROUP'
];

/* ── HEADER STATS ───────────────────────────────────────────── */
function initHeaderStats() {
  const totalFines = trendData.reduce((s, d) => s + d.FINES, 0);
  const totalArrests = trendData.reduce((s, d) => s + d.ARRESTS, 0);
  const totalCharges = trendData.reduce((s, d) => s + d.CHARGES, 0);

  document.getElementById('total-fines').textContent = fmt(Math.round(totalFines));
  document.getElementById('total-arrests').textContent = fmt(Math.round(totalArrests));
  document.getElementById('total-charges').textContent = fmt(Math.round(totalCharges));
}


/* ── TAB SWITCHING ──────────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');

    const drawMap = {
      story:        drawStory,
      trends:       drawTrend,
      breakdown:    drawBreakdown,
      jurisdiction: drawJurisdiction
    };
    drawMap[btn.dataset.tab]?.();
  });
});


/* ── TRENDS CONTROLS ────────────────────────────────────────── */
document.querySelectorAll('[data-metric]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-metric]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    trendMetric = btn.dataset.metric;
    drawTrend();
  });
});

document.querySelectorAll('[data-offence]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-offence]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    trendOffence = btn.dataset.offence;
    drawTrend();
  });
});


/* ── BREAKDOWN CONTROLS ─────────────────────────────────────── */
document.querySelectorAll('[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    bkView = btn.dataset.view;
    drawBreakdown();
  });
});

document.querySelectorAll('[data-bk-metric]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-bk-metric]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    bkMetric = btn.dataset.bkMetric;
    drawBreakdown();
  });
});


/* ── JURISDICTION CONTROLS ──────────────────────────────────── */
document.querySelectorAll('[data-jur-metric]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-jur-metric]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    jurMetric = btn.dataset.jurMetric;
    drawJurisdiction();
  });
});


/* ── RESPONSIVE RESIZE ──────────────────────────────────────── */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const activeId = document.querySelector('.section.active')?.id;
    const redrawMap = {
      'tab-story':        drawStory,
      'tab-trends':       drawTrend,
      'tab-breakdown':    drawBreakdown,
      'tab-jurisdiction': drawJurisdiction
    };
    redrawMap[activeId]?.();
  }, 150);
});


/* ── INITIAL RENDER ─────────────────────────────────────────── */
init();

async function init() {
  await loadData();

  initFilterPanel();
  initHeaderStats();
  drawStory();
}

/* ── DATA FILTER PANEL ──────────────────────────────────────── */
function initFilterPanel() {
  const grid = document.getElementById('filter-grid');
  if (!grid) return;

  grid.innerHTML = '';
  grid.appendChild(buildYearFilterBlock());
  grid.appendChild(buildAgeFilterBlock());

  FILTER_CHECKBOX_FIELDS.forEach(field => {
    grid.appendChild(buildCheckboxFilterBlock(field));
  });

  grid.addEventListener('change', e => {
    if (e.target.id === 'filter-year-min' || e.target.id === 'filter-year-max') {
      clampYearSelects();
    }
    if (e.target.id === 'filter-age-start' || e.target.id === 'filter-age-end') {
      clampAgeSelects();
    }
    applyFiltersFromUI();
  });

  document.querySelectorAll('input[name="filter-year-mode"]').forEach(r => {
    r.addEventListener('change', () => {
      toggleYearMode(r.value === 'pick');
    });
  });
  document.querySelectorAll('input[name="filter-age-mode"]').forEach(r => {
    r.addEventListener('change', () => {
      toggleAgeMode(r.value === 'pick');
    });
  });

  document.getElementById('filter-clear')?.addEventListener('click', () => {
    resetFilterUi();
    clearAllFilters();
    updateFilterCount();
    initHeaderStats();
    redrawActiveSection();
  });

  updateFilterCount();
}

function buildYearFilterBlock() {
  const wrap = document.createElement('div');
  wrap.className = 'filter-field filter-field--wide';

  const title = document.createElement('div');
  title.className = 'filter-field-title';
  title.textContent = FILTER_LABELS.YEAR;

  const mode = document.createElement('div');
  mode.className = 'filter-mode-row';
  mode.innerHTML = `
    <label class="filter-radio"><input type="radio" name="filter-year-mode" value="range" checked> Year range</label>
    <label class="filter-radio"><input type="radio" name="filter-year-mode" value="pick"> Specific years</label>
  `;

  const years = getDistinctValues('YEAR');
  const rangeWrap = document.createElement('div');
  rangeWrap.className = 'filter-year-range-wrap filter-row';
  const minSel = document.createElement('select');
  minSel.id = 'filter-year-min';
  const maxSel = document.createElement('select');
  maxSel.id = 'filter-year-max';
  years.forEach(y => {
    minSel.appendChild(new Option(String(y), String(y)));
    maxSel.appendChild(new Option(String(y), String(y)));
  });
  minSel.value = String(years[0]);
  maxSel.value = String(years[years.length - 1]);
  rangeWrap.appendChild(document.createTextNode('From '));
  rangeWrap.appendChild(minSel);
  rangeWrap.appendChild(document.createTextNode(' to '));
  rangeWrap.appendChild(maxSel);

  const pickWrap = document.createElement('div');
  pickWrap.className = 'filter-year-pick-wrap filter-checkboxes is-hidden';
  years.forEach(y => {
    const lab = document.createElement('label');
    lab.className = 'filter-cb-label';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'filter-year-cb';
    cb.value = String(y);
    cb.checked = true;
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(' ' + y));
    pickWrap.appendChild(lab);
  });

  wrap.appendChild(title);
  wrap.appendChild(mode);
  wrap.appendChild(rangeWrap);
  wrap.appendChild(pickWrap);
  return wrap;
}

function buildAgeFilterBlock() {
  const wrap = document.createElement('div');
  wrap.className = 'filter-field filter-field--wide';

  const title = document.createElement('div');
  title.className = 'filter-field-title';
  title.textContent = FILTER_LABELS.AGE_GROUP;

  const mode = document.createElement('div');
  mode.className = 'filter-mode-row';
  mode.innerHTML = `
    <label class="filter-radio"><input type="radio" name="filter-age-mode" value="range" checked> Age range (ordered bands)</label>
    <label class="filter-radio"><input type="radio" name="filter-age-mode" value="pick"> Specific age groups</label>
  `;

  const ageOrder = getAgeGroupOrder();
  const rangeWrap = document.createElement('div');
  rangeWrap.className = 'filter-age-range-wrap filter-row';
  const startSel = document.createElement('select');
  startSel.id = 'filter-age-start';
  const endSel = document.createElement('select');
  endSel.id = 'filter-age-end';
  ageOrder.forEach(a => {
    startSel.appendChild(new Option(a, a));
    endSel.appendChild(new Option(a, a));
  });
  startSel.value = ageOrder[0];
  endSel.value = ageOrder[ageOrder.length - 1];
  rangeWrap.appendChild(document.createTextNode('From '));
  rangeWrap.appendChild(startSel);
  rangeWrap.appendChild(document.createTextNode(' to '));
  rangeWrap.appendChild(endSel);

  const pickWrap = document.createElement('div');
  pickWrap.className = 'filter-age-pick-wrap filter-checkboxes is-hidden';
  ageOrder.forEach(a => {
    const lab = document.createElement('label');
    lab.className = 'filter-cb-label';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'filter-age-cb';
    cb.value = a;
    cb.dataset.value = a;
    cb.checked = true;
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(' ' + a));
    pickWrap.appendChild(lab);
  });

  wrap.appendChild(title);
  wrap.appendChild(mode);
  wrap.appendChild(rangeWrap);
  wrap.appendChild(pickWrap);
  return wrap;
}

function buildCheckboxFilterBlock(field) {
  const wrap = document.createElement('div');
  wrap.className = 'filter-field';

  const title = document.createElement('div');
  title.className = 'filter-field-title';
  title.textContent = FILTER_LABELS[field] || field;

  const box = document.createElement('div');
  box.className = 'filter-checkboxes';

  const values = getDistinctValues(field);
  values.forEach(v => {
    const lab = document.createElement('label');
    lab.className = 'filter-cb-label';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'filter-cb';
    cb.dataset.field = field;
    cb.dataset.value = String(v);
    cb.checked = true;
    const display =
      field === 'METRIC' && LABELS[v] ? LABELS[v] : String(v);
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(' ' + display));
    box.appendChild(lab);
  });

  wrap.appendChild(title);
  wrap.appendChild(box);
  return wrap;
}

function toggleYearMode(pick) {
  document.querySelector('.filter-year-range-wrap')?.classList.toggle('is-hidden', pick);
  document.querySelector('.filter-year-pick-wrap')?.classList.toggle('is-hidden', !pick);
}

function toggleAgeMode(pick) {
  document.querySelector('.filter-age-range-wrap')?.classList.toggle('is-hidden', pick);
  document.querySelector('.filter-age-pick-wrap')?.classList.toggle('is-hidden', !pick);
}

function clampYearSelects() {
  const minEl = document.getElementById('filter-year-min');
  const maxEl = document.getElementById('filter-year-max');
  if (!minEl || !maxEl) return;
  let a = +minEl.value;
  let b = +maxEl.value;
  if (a > b) {
    minEl.value = String(b);
    maxEl.value = String(a);
  }
}

function clampAgeSelects() {
  const order = getAgeGroupOrder();
  const sEl = document.getElementById('filter-age-start');
  const eEl = document.getElementById('filter-age-end');
  if (!sEl || !eEl) return;
  let i0 = order.indexOf(sEl.value);
  let i1 = order.indexOf(eEl.value);
  if (i0 < 0 || i1 < 0) return;
  if (i0 > i1) {
    sEl.value = order[i1];
    eEl.value = order[i0];
  }
}

function buildFilterStateFromDom() {
  const state = {};
  const years = getDistinctValues('YEAR');
  const ageOrder = getAgeGroupOrder();

  const yearMode =
    document.querySelector('input[name="filter-year-mode"]:checked')?.value || 'range';
  if (yearMode === 'range') {
    const minY = +document.getElementById('filter-year-min')?.value;
    const maxY = +document.getElementById('filter-year-max')?.value;
    const lo = Math.min(minY, maxY);
    const hi = Math.max(minY, maxY);
    if (lo > years[0] || hi < years[years.length - 1]) {
      state.YEAR = { type: 'range', min: lo, max: hi };
    }
  } else {
    const picked = [
      ...document.querySelectorAll('input.filter-year-cb:checked')
    ].map(el => +el.value);
    if (picked.length > 0 && picked.length < years.length) {
      state.YEAR = { type: 'pick', set: new Set(picked) };
    }
  }

  const ageMode =
    document.querySelector('input[name="filter-age-mode"]:checked')?.value || 'range';
  if (ageMode === 'range') {
    const startLab = document.getElementById('filter-age-start')?.value;
    const endLab = document.getElementById('filter-age-end')?.value;
    const i0 = ageOrder.indexOf(startLab);
    const i1 = ageOrder.indexOf(endLab);
    if (i0 >= 0 && i1 >= 0) {
      const startIdx = Math.min(i0, i1);
      const endIdx = Math.max(i0, i1);
      if (startIdx > 0 || endIdx < ageOrder.length - 1) {
        state.AGE_GROUP = {
          type: 'range',
          startIdx,
          endIdx,
          order: [...ageOrder]
        };
      }
    }
  } else {
    const picked = [
      ...document.querySelectorAll('input.filter-age-cb:checked')
    ].map(el => el.value);
    if (picked.length > 0 && picked.length < ageOrder.length) {
      state.AGE_GROUP = { type: 'pick', set: new Set(picked) };
    }
  }

  FILTER_CHECKBOX_FIELDS.forEach(field => {
    const all = document.querySelectorAll(
      `input.filter-cb[data-field="${field}"]`
    );
    const checked = document.querySelectorAll(
      `input.filter-cb[data-field="${field}"]:checked`
    );
    if (checked.length > 0 && checked.length < all.length) {
      const set = new Set();
      checked.forEach(el => {
        const raw = el.getAttribute('data-value');
        if (raw != null) set.add(raw);
      });
      state[field] = set;
    }
  });

  return state;
}

function resetFilterUi() {
  const years = getDistinctValues('YEAR');
  const ageOrder = getAgeGroupOrder();

  const yrMode = document.querySelector('input[name="filter-year-mode"][value="range"]');
  if (yrMode) yrMode.checked = true;
  toggleYearMode(false);
  const minY = document.getElementById('filter-year-min');
  const maxY = document.getElementById('filter-year-max');
  if (minY && years.length) minY.value = String(years[0]);
  if (maxY && years.length) maxY.value = String(years[years.length - 1]);
  document.querySelectorAll('input.filter-year-cb').forEach(cb => {
    cb.checked = true;
  });

  const agMode = document.querySelector('input[name="filter-age-mode"][value="range"]');
  if (agMode) agMode.checked = true;
  toggleAgeMode(false);
  const s = document.getElementById('filter-age-start');
  const e = document.getElementById('filter-age-end');
  if (s && ageOrder.length) s.value = ageOrder[0];
  if (e && ageOrder.length) e.value = ageOrder[ageOrder.length - 1];
  document.querySelectorAll('input.filter-age-cb').forEach(cb => {
    cb.checked = true;
  });

  document.querySelectorAll('input.filter-cb').forEach(cb => {
    cb.checked = true;
  });
}

function applyFiltersFromUI() {
  setFilterState(buildFilterStateFromDom());
  updateFilterCount();
  initHeaderStats();
  redrawActiveSection();
}

function updateFilterCount() {
  const el = document.getElementById('filter-count');
  if (!el) return;
  const n = getFilteredRowCount();
  const total = rawData.length;
  el.textContent =
    n === total
      ? `${total.toLocaleString()} rows (full dataset)`
      : `${n.toLocaleString()} of ${total.toLocaleString()} rows match`;
}

function redrawActiveSection() {
  const activeId = document.querySelector('.section.active')?.id;
  const redrawMap = {
    'tab-story':        drawStory,
    'tab-trends':       drawTrend,
    'tab-breakdown':    drawBreakdown,
    'tab-jurisdiction': drawJurisdiction
  };
  redrawMap[activeId]?.();
}
