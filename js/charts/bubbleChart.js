// ===========================
// Demographics Chart — Bubble Chart
// X = Age Group, two bubbles per group (Police / Camera)
// Bubble size = selected metric
// ===========================

import { config, jurisdictionNames } from '../modules/config.js';
import { filterData } from '../utils/dataLoader.js';
import { formatNumber } from '../utils/helpers.js';
import { showTooltip, hideTooltip } from '../utils/tooltip.js';
import { renderStory, ensureStoryPanel, getDemographicStory, getDataNotes } from './storyTelling.js';

const AGE_ORDER = ['0-16', '17-25', '26-39', '40-64', '65 and over'];

// State
let selectedMethods = new Set(['Police', 'Camera']);
let selectedMetric  = 'fines';
let showAllAges     = false; // whether to include the 0-65+ aggregate bubble

export function createBubbleChart() {
    ensureStoryPanel('demographics', 'demo-story-panel', 'demographics-chart');
    buildControls();
    document.getElementById('demo-jurisdiction').addEventListener('change', updateChart);
    document.getElementById('demo-year').addEventListener('change', updateChart);
    updateChart();
}

// ─── Controls ────────────────────────────────────────────────────────────────

function buildControls() {
    if (document.getElementById('demo-bubble-controls')) return;

    const panel = document.querySelector('#demographics .controls-panel');
    if (!panel) return;

    // Remove stale controls from previous chart version
    ['aggregate-toggle-wrapper', 'demo-method-filter-wrapper'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    const wrapper = document.createElement('div');
    wrapper.id = 'demo-bubble-controls';
    wrapper.style.cssText = 'margin-top:1rem;display:flex;flex-wrap:wrap;gap:1.25rem;align-items:flex-start;';

    // ── Detection method pills — NO "All" button ──────────────────────────
    const methodRow   = makeLabelRow('Detection method:');
    const methodPills = methodRow.querySelector('.pill-group');

    [
        { key: 'Police', color: 'var(--police-color)', icon: '👮' },
        { key: 'Camera', color: 'var(--camera-color)', icon: '📷' },
    ].forEach(({ key, color, icon }) => {
        const lbl = document.createElement('label');
        lbl.dataset.method = key;
        let on = selectedMethods.has(key);
        lbl.style.cssText = pillStyle(color, on);

        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.checked = on; cb.style.display = 'none';

        cb.addEventListener('change', () => {
            if (!cb.checked && selectedMethods.size === 1) { cb.checked = true; return; }
            if (cb.checked) selectedMethods.add(key);
            else            selectedMethods.delete(key);
            on = cb.checked;
            lbl.style.cssText = pillStyle(color, on);
            updateChart();
        });

        lbl.appendChild(cb);
        lbl.appendChild(document.createTextNode(icon + '\u00a0' + key));
        methodPills.appendChild(lbl);
    });

    wrapper.appendChild(methodRow);

    // ── Bubble size — single-select metric ───────────────────────────────
    const METRIC_COLORS = { fines: '#a78bfa', charges: '#fbbf24', arrests: '#f472b6' };
    const metricRow   = makeLabelRow('Bubble size:');
    const metricPills = metricRow.querySelector('.pill-group');

    [
        { key: 'fines',   label: '📋 Fines'   },
        { key: 'charges', label: '⚖️ Charges' },
        { key: 'arrests', label: '🚔 Arrests' },
    ].forEach(({ key, label }) => {
        const color = METRIC_COLORS[key];
        const btn   = document.createElement('button');
        btn.dataset.metric = key;
        btn.textContent    = label;
        btn.style.cssText  = pillStyle(color, key === selectedMetric);

        btn.addEventListener('click', () => {
            selectedMetric = key;
            metricPills.querySelectorAll('button').forEach(b => {
                b.style.cssText = pillStyle(METRIC_COLORS[b.dataset.metric], b.dataset.metric === key);
            });
            updateChart();
        });

        metricPills.appendChild(btn);
    });

    wrapper.appendChild(metricRow);

    // ── 0-65+ aggregate toggle ────────────────────────────────────────────
    const aggRow   = makeLabelRow('Age group:');
    const aggPills = aggRow.querySelector('.pill-group');

    const aggColor = '#64748b';
    const aggLbl   = document.createElement('label');
    aggLbl.id      = 'demo-agg-toggle';
    aggLbl.style.cssText = pillStyle(aggColor, showAllAges);

    const aggCb    = document.createElement('input');
    aggCb.type     = 'checkbox'; aggCb.checked = showAllAges; aggCb.style.display = 'none';

    aggCb.addEventListener('change', () => {
        showAllAges          = aggCb.checked;
        aggLbl.style.cssText = pillStyle(aggColor, showAllAges);
        updateChart();
    });

    aggLbl.appendChild(aggCb);
    aggLbl.appendChild(document.createTextNode('📊\u00a0Show 0-65+ aggregate'));
    aggPills.appendChild(aggLbl);
    wrapper.appendChild(aggRow);

    panel.appendChild(wrapper);
}

function makeLabelRow(text) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;';
    const lbl = document.createElement('span');
    lbl.textContent = text;
    lbl.style.cssText = 'font-size:0.88rem;font-weight:600;color:var(--text-primary);white-space:nowrap;';
    row.appendChild(lbl);
    const group = document.createElement('div');
    group.className = 'pill-group';
    group.style.cssText = 'display:flex;gap:0.4rem;flex-wrap:wrap;';
    row.appendChild(group);
    return row;
}

function pillStyle(color, active) {
    return `display:inline-flex;align-items:center;gap:5px;padding:5px 14px;
        border-radius:20px;cursor:pointer;font-size:0.82rem;font-weight:600;
        user-select:none;border:2px solid ${color};
        background-color:${active ? color : 'transparent'};
        color:${active ? '#fff' : color};
        transition:background-color 0.18s,color 0.18s;`;
}

// ─── Data: aggregate by ageGroup × detectionMethod ───────────────────────────
// getDemographicBreakdown drops 0-65+ rows (includeAggregate=false), which
// silently erases Camera data for jurisdictions that only report aggregate ages.
// We fix this by re-aggregating from filterData directly: prefer individual age
// rows per method; fall back to the 0-65+ aggregate bucket shown as "All ages".

function buildCellData(jurisdiction, year) {
    const AGGS = ['0-65+', 'All ages'];
    const all  = filterData({ jurisdiction, year });
    const result = [];

    // Check if ANY method has individual (non-aggregate) age rows for this
    // jurisdiction/year. If so, aggregate-only methods are treated as optional
    // extras that respect the showAllAges toggle — otherwise they are the only
    // data available and must always show.
    const anyIndividual = all.some(
        d => !AGGS.includes(d.ageGroup)
    );

    ['Police', 'Camera'].forEach(method => {
        const mRows      = all.filter(d => d.detectionMethod === method);
        const individual = mRows.filter(d => !AGGS.includes(d.ageGroup));
        const aggRows    = mRows.filter(d => AGGS.includes(d.ageGroup));

        if (individual.length > 0) {
            // Method has individual age rows — use them
            const byAge = d3.rollups(
                individual,
                v => ({
                    fines:   d3.sum(v, r => r.fines),
                    charges: d3.sum(v, r => r.charges),
                    arrests: d3.sum(v, r => r.arrests),
                }),
                d => d.ageGroup
            );
            byAge.forEach(([age, vals]) =>
                result.push({ ageGroup: age, detectionMethod: method, ...vals })
            );

            // Also add 0-65+ bubble only when toggle is on
            if (showAllAges && aggRows.length > 0) {
                result.push({
                    ageGroup:        'All ages',
                    detectionMethod: method,
                    fines:           d3.sum(aggRows, r => r.fines),
                    charges:         d3.sum(aggRows, r => r.charges),
                    arrests:         d3.sum(aggRows, r => r.arrests),
                });
            }
        } else if (aggRows.length > 0) {
            // Method only has aggregate rows.
            // — If the jurisdiction has NO individual rows at all (e.g. QLD 2022):
            //   always show so the method is never invisible.
            // — If the jurisdiction DOES have individual rows for other methods
            //   (e.g. NSW Camera alongside NSW Police individual rows):
            //   only show when toggle is on, so it doesn't clutter the main view.
            if (!anyIndividual || showAllAges) {
                result.push({
                    ageGroup:        'All ages',
                    detectionMethod: method,
                    fines:           d3.sum(aggRows, r => r.fines),
                    charges:         d3.sum(aggRows, r => r.charges),
                    arrests:         d3.sum(aggRows, r => r.arrests),
                });
            }
        }
    });

    return result;
}

// ─── Chart renderer ───────────────────────────────────────────────────────────

function updateChart() {
    const jurisdiction = document.getElementById('demo-jurisdiction').value;
    const year         = +document.getElementById('demo-year').value;
    const container    = document.getElementById('demographics-chart');

    const activeMethods = [...selectedMethods];

    renderStory(
        'demo-story-panel',
        getDemographicStory(jurisdiction, year, activeMethods),
        getDataNotes(jurisdiction, activeMethods)
    );
    d3.select('#demographics-chart').selectAll('*').remove();

    const allRows = buildCellData(jurisdiction, year);
    const rows    = allRows.filter(d => selectedMethods.has(d.detectionMethod));

    if (!rows.length) {
        d3.select('#demographics-chart').append('p')
            .style('text-align', 'center').style('padding', '60px')
            .style('color', 'var(--text-secondary)')
            .text('No data available for this selection.');
        return;
    }

    renderBubbles(container, jurisdiction, year, rows);
}

function renderBubbles(container, jurisdiction, year, rows) {
    const activeMethods = [...selectedMethods];
    const metricLabel   = { fines: 'Fines', charges: 'Charges', arrests: 'Arrests' }[selectedMetric];

    // Build ordered age list; append 'All ages' at the end if present
    const allAges = [...AGE_ORDER, 'All ages'];
    const ages    = allAges.filter(a => rows.some(d => d.ageGroup === a));

    if (!ages.length) {
        d3.select('#demographics-chart').append('p')
            .style('text-align', 'center').style('padding', '60px')
            .style('color', 'var(--text-secondary)').text('No age-group data available.');
        return;
    }

    // ── Layout ────────────────────────────────────────────────────────────
    const containerW = container.clientWidth || 900;

    // Two-pass layout: first pass estimates maxR to size the right margin;
    // second pass uses the correct innerW to get the real maxR and scales.
    const LABEL_W  = 44;   // px needed for the value label text next to legend circles
    const LEG_GAP  = 20;   // gutter between chart and legend

    // Pass 1 — rough estimate (left=30, bottom axis space doesn't affect width)
    const roughInnerW = containerW - 30 - LEG_GAP - 52 * 2 - LABEL_W - 20;
    const tmpX    = d3.scaleBand().domain(ages).range([0, Math.max(roughInnerW, 100)]).padding(0.28);
    const tmpSlot = d3.scaleBand().domain(activeMethods).range([0, tmpX.bandwidth()]).padding(0.12);
    const estMaxR = Math.min(tmpSlot.bandwidth() / 2, 52);

    // Legend width = gap + circle diameter + label
    const LEGEND_W = LEG_GAP + estMaxR * 2 + LABEL_W;
    const margin   = { top: 72, right: LEGEND_W + 10, bottom: 72, left: 30 };
    const innerW   = containerW - margin.left - margin.right;

    const xScale = d3.scaleBand()
        .domain(ages)
        .range([0, innerW])
        .padding(0.28);

    const methodSlot = d3.scaleBand()
        .domain(activeMethods)
        .range([0, xScale.bandwidth()])
        .padding(0.12);

    const maxVal = d3.max(rows, d => d[selectedMetric] || 0) || 1;
    const maxR   = Math.min(methodSlot.bandwidth() / 2, 52);
    const rScale = d3.scaleSqrt().domain([0, maxVal]).range([0, maxR]);

    // Pre-calculate legend height so svgH is tall enough to contain it
    const legendVals = [
        Math.round(maxVal * 0.25),
        Math.round(maxVal * 0.6),
        maxVal,
    ].filter(v => v > 0);
    const legendH = legendVals.reduce((acc, val) => {
        const r = rScale(val);
        return acc + r * 2 + 8;
    }, 16 /* title */);

    const baseY   = maxR + 8;
    const chartH  = maxR * 2 + 16;
    // svgH must accommodate both the bubble band + axes AND the legend height
    const svgH    = Math.max(chartH, legendH) + margin.top + margin.bottom;

    const svg = d3.select('#demographics-chart')
        .append('svg')
        .attr('width', containerW)
        .attr('height', svgH);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // ── Title ─────────────────────────────────────────────────────────────
    const jurName = jurisdictionNames[jurisdiction] || jurisdiction;
    g.append('text')
        .attr('x', innerW / 2).attr('y', -46)
        .attr('text-anchor', 'middle')
        .style('font-size', '15px').style('font-weight', '700')
        .style('fill', 'var(--text-primary)')
        .text(`${jurName} ${year} — Risk Profile by Age Group`);

    g.append('text')
        .attr('x', innerW / 2).attr('y', -26)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px').style('fill', 'var(--text-secondary)')
        .text(`Bubble size = ${metricLabel}  ·  ${activeMethods.join(' + ')} detection`);

    // ── Subtle column guides ───────────────────────────────────────────────
    ages.forEach(age => {
        g.append('line')
            .attr('x1', xScale(age) + xScale.bandwidth() / 2)
            .attr('x2', xScale(age) + xScale.bandwidth() / 2)
            .attr('y1', 0).attr('y2', chartH)
            .attr('stroke', 'var(--border-color)')
            .attr('stroke-dasharray', '3,3').attr('opacity', 0.15);
    });

    // ── Baseline ──────────────────────────────────────────────────────────
    g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', baseY).attr('y2', baseY)
        .attr('stroke', 'var(--border-color)').attr('stroke-width', 1).attr('opacity', 0.2);

    // ── Bubbles ───────────────────────────────────────────────────────────
    ages.forEach(age => {
        activeMethods.forEach(method => {
            const row   = rows.find(d => d.ageGroup === age && d.detectionMethod === method);
            const val   = row ? (row[selectedMetric] || 0) : 0;
            if (val === 0) return;   // skip zero — no ghost dots

            const r     = rScale(val);
            const cx    = xScale(age) + methodSlot(method) + methodSlot.bandwidth() / 2;
            const color = method === 'Police' ? config.colors.police : config.colors.camera;

            const circle = g.append('circle')
                .attr('cx', cx).attr('cy', baseY)
                .attr('r', 0)
                .attr('fill', color).attr('opacity', 0.85)
                .attr('stroke', 'rgba(255,255,255,0.25)').attr('stroke-width', 1.5)
                .style('cursor', 'pointer');

            circle.transition().duration(550).ease(d3.easeCubicOut).attr('r', r);

            circle
                .on('mouseover', function(event) {
                    d3.select(this).attr('opacity', 1).attr('stroke-width', 2.5);
                    showTooltip(buildTip(age, method, row), event);
                })
                .on('mousemove', function(event) {
                    showTooltip(buildTip(age, method, row), event);
                })
                .on('mouseout', function() {
                    d3.select(this).attr('opacity', 0.85).attr('stroke-width', 1.5);
                    hideTooltip();
                });

            // Value label inside if big enough
            if (r >= 20) {
                g.append('text')
                    .attr('x', cx).attr('y', baseY + 4)
                    .attr('text-anchor', 'middle')
                    .style('font-size', `${Math.min(12, r * 0.38)}px`)
                    .style('font-weight', '700').style('fill', '#fff')
                    .style('pointer-events', 'none')
                    .text(formatNumber(val));
            }
        });
    });

    // ── X axis — age group labels ─────────────────────────────────────────
    const axisY = chartH + 14;
    ages.forEach(age => {
        g.append('text')
            .attr('x', xScale(age) + xScale.bandwidth() / 2)
            .attr('y', axisY)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px').style('font-weight', '600')
            .style('fill', 'var(--text-primary)')
            .text(age);
    });

    // ── Method sub-labels (small, only under present bubbles) ─────────────
    ages.forEach(age => {
        activeMethods.forEach(method => {
            const row = rows.find(d => d.ageGroup === age && d.detectionMethod === method);
            if (!row || (row[selectedMetric] || 0) === 0) return;
            const cx    = xScale(age) + methodSlot(method) + methodSlot.bandwidth() / 2;
            const color = method === 'Police' ? config.colors.police : config.colors.camera;
            g.append('text')
                .attr('x', cx).attr('y', axisY + 16)
                .attr('text-anchor', 'middle')
                .style('font-size', '9px').style('font-weight', '700')
                .style('fill', color).style('opacity', 0.7)
                .text(method === 'Police' ? '👮' : '📷');
        });
    });

    g.append('text')
        .attr('x', innerW / 2).attr('y', chartH + 52)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px').style('font-weight', '600')
        .style('fill', 'currentColor').text('Age Group');

    // ── Size legend — drawn inside the right margin, aligned to bubble centre ─
    const legX = innerW + LEG_GAP;

    // Start the legend so it's vertically centred around baseY
    const totalLegH = legendVals.reduce((acc, val) => acc + rScale(val) * 2 + 8, 16);
    const legStartY = baseY - totalLegH / 2;

    g.append('text')
        .attr('x', legX).attr('y', legStartY)
        .style('font-size', '10px').style('font-weight', '700')
        .style('fill', 'var(--text-secondary)')
        .text(metricLabel);

    let offsetY = legStartY + 16;
    legendVals.forEach(val => {
        const r  = rScale(val);
        const cy = offsetY + r;
        g.append('circle')
            .attr('cx', legX + maxR).attr('cy', cy).attr('r', r)
            .attr('fill', 'none')
            .attr('stroke', 'var(--text-secondary)').attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,2').attr('opacity', 0.5);
        g.append('text')
            .attr('x', legX + maxR * 2 + 6).attr('y', cy + 4)
            .style('font-size', '9px').style('fill', 'var(--text-secondary)')
            .text(formatNumber(val));
        offsetY = cy + r + 8;
    });

    // ── Bottom colour legend ──────────────────────────────────────────────
    const legDiv = d3.select('#demographics-chart').append('div')
        .style('display', 'flex').style('gap', '20px')
        .style('justify-content', 'center').style('padding', '12px 0 4px');

    activeMethods.forEach(method => {
        const color = method === 'Police' ? config.colors.police : config.colors.camera;
        const el    = legDiv.append('div')
            .style('display', 'flex').style('align-items', 'center').style('gap', '7px');
        el.append('div')
            .style('width', '13px').style('height', '13px')
            .style('border-radius', '50%').style('background', color)
            .style('opacity', '0.9').style('flex-shrink', '0');
        el.append('span')
            .style('font-size', '13px').style('color', 'var(--text-primary)')
            .text(method + ' detection');
    });
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function buildTip(age, method, row) {
    if (!row) return `<strong>${age} — ${method}</strong><br>No data`;
    return (
        `<strong>${age} \u2014 ${method}</strong><br>` +
        `📋 Fines: ${formatNumber(row.fines || 0)}<br>` +
        `⚖️ Charges: ${formatNumber(row.charges || 0)}<br>` +
        `🚔 Arrests: ${formatNumber(row.arrests || 0)}`
    );
}