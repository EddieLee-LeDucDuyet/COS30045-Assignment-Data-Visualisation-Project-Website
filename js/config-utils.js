/* ===========================================================
   Configuration, Colors & Utility Functions
   =========================================================== */

/* ============================================================
   Mobile Phone Enforcement Dashboard
   ============================================================ */

// ── DATA & STATE ────────────────────────────────────────────
let rawData = [];
let yearlyData = [];
let detectionData = [];
let ageData = [];
let locationData = [];
let stateData = [];

// ── COLORS ──────────────────────────────────────────────────
const COLORS = {
  Camera: '#ef4444',
  Police: '#3b82f6',
  Unknown: '#6b7280',
  
  age_0_16: '#8b5cf6',
  age_17_25: '#f59e0b',
  age_26_39: '#ef4444',
  age_40_64: '#3b82f6',
  age_65_over: '#10b981',
  age_unknown: '#6b7280',
  
  NSW: '#ef4444',
  VIC: '#f59e0b',
  QLD: '#3b82f6',
  WA: '#10b981',
  SA: '#8b5cf6',
  ACT: '#ec4899',
  NT: '#f97316',
  TAS: '#06b6d4'
};

// ── NUMBER FORMATTING ───────────────────────────────────────
function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toLocaleString();
}

function fmtFull(n) {
  return n.toLocaleString();
}

function fmtPct(n) {
  return n.toFixed(1) + '%';
}

// ── TOOLTIP ─────────────────────────────────────────────────
const tooltip = d3.select('#tooltip');

function showTooltip(html, e) {
  tooltip.html(html).classed('visible', true)
    .style('left', (e.clientX + 16) + 'px')
    .style('top', (e.clientY - 10) + 'px');
}

function hideTooltip() {
  tooltip.classed('visible', false);
}

function onMouseMove(e) {
  tooltip.style('left', (e.clientX + 16) + 'px')
    .style('top', (e.clientY - 10) + 'px');
}

// ── HELPER FUNCTIONS ────────────────────────────────────────
function svgDims(selector) {
  const el = document.querySelector(selector);
  return {
    w: el.clientWidth || 800,
    h: +el.getAttribute('height')
  };
}

function renderLegend(containerId, items) {
  const lgd = d3.select(containerId).html('');
  items.forEach(item => {
    lgd.append('div').attr('class', 'legend-item')
      .html(`<div class="legend-dot" style="background:${item.color}"></div>${item.label}`);
  });
}

function addGridLines(g, yScale, width, ticks = 5) {
  g.append('g')
    .selectAll('.grid-line')
    .data(yScale.ticks(ticks))
    .enter().append('line')
      .attr('x1', 0).attr('x2', width)
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('stroke', '#1e2540')
      .attr('stroke-dasharray', '3,5')
      .attr('opacity', 0.5);
}