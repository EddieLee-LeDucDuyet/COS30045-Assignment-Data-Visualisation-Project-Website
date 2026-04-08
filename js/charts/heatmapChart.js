// ===========================
// Fines Heatmap Chart
// Years (X) × Jurisdictions (Y) — colour encodes total fines
// ===========================

import { config, jurisdictionNames } from '../modules/config.js';
import { getYearlyTrends } from '../utils/dataLoader.js';
import { formatNumber } from '../utils/helpers.js';
import { showTooltip, hideTooltip } from '../utils/tooltip.js';
import { renderStory, ensureStoryPanel, getFinesStory, getDataNotes } from './storyTelling.js';

const ALL_YEARS        = d3.range(2008, 2025);
const ALL_JURISDICTIONS = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

let selectedMethods  = new Set(['Police', 'Camera']);
let selectedMetrics  = new Set(['fines']); // any combo of 'fines','charges','arrests'

export function createHeatmapChart(containerId = 'fines-chart') {
    ensureStoryPanel('fines', 'fines-story-panel', containerId);
    injectControls(containerId);
    renderHeatmap(containerId);
}

// ─── Controls ────────────────────────────────────────────────────────────────

function injectControls(containerId) {
    if (document.getElementById('fines-controls-wrapper')) return;

    const chartDiv = document.getElementById(containerId);
    const wrapper  = document.createElement('div');
    wrapper.id     = 'fines-controls-wrapper';
    wrapper.style.cssText = `
        margin-bottom: 1.25rem;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: flex-start;
    `;

    // ── Detection method pills ─────────────────────────────────────────────
    const methodRow = makePillRow('Detection method:');
    const methodPills = methodRow.querySelector('.pill-row');

    makeUtilBtn('All', () => {
        selectedMethods = new Set(['Police', 'Camera']);
        syncMethodPills();
        renderHeatmap(containerId);
    }, methodPills);

    [
        { key: 'Police', color: 'var(--police-color)', icon: '👮' },
        { key: 'Camera', color: 'var(--camera-color)', icon: '📷' },
    ].forEach(({ key, color, icon }) => {
        const label = document.createElement('label');
        label.dataset.method = key;
        label.style.cssText = pillStyle(color, true);
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.checked = true; cb.style.display = 'none';

        cb.addEventListener('change', () => {
            if (cb.checked) { selectedMethods.add(key); }
            else { if (selectedMethods.size === 1) { cb.checked = true; return; } selectedMethods.delete(key); }
            styleMethodPill(label, cb.checked, color);
            renderHeatmap(containerId);
        });

        label.appendChild(cb);
        label.appendChild(document.createTextNode(icon + ' ' + key));
        methodPills.appendChild(label);
    });

    wrapper.appendChild(methodRow);

    // ── Metric selector (multi-select checkboxes) ──────────────────────────
    const metricRow  = makePillRow('Colour encodes:');
    const metricPills = metricRow.querySelector('.pill-row');

    [
        { key: 'fines',   label: '📋 Fines',   color: '#a78bfa' },
        { key: 'charges', label: '⚖️ Charges', color: '#fbbf24' },
        { key: 'arrests', label: '🚔 Arrests', color: '#f472b6' },
    ].forEach(({ key, label, color }) => {
        const lbl = document.createElement('label');
        lbl.dataset.metric = key;
        const active = selectedMetrics.has(key);
        lbl.style.cssText = metricPillStyle(color, active);

        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.checked = active; cb.style.display = 'none';

        cb.addEventListener('change', () => {
            if (cb.checked) { selectedMetrics.add(key); }
            else {
                if (selectedMetrics.size === 1) { cb.checked = true; return; }
                selectedMetrics.delete(key);
            }
            lbl.style.cssText = metricPillStyle(color, cb.checked);
            renderHeatmap(containerId);
        });

        lbl.appendChild(cb);
        lbl.appendChild(document.createTextNode(label));
        metricPills.appendChild(lbl);
    });

    wrapper.appendChild(metricRow);

    chartDiv.parentElement.insertBefore(wrapper, chartDiv);
}

function makePillRow(headingText) {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;';

    const heading = document.createElement('span');
    heading.textContent = headingText;
    heading.style.cssText = 'font-size: 0.9rem; font-weight: 600; color: var(--text-primary); white-space: nowrap;';
    row.appendChild(heading);

    const pills = document.createElement('div');
    pills.className    = 'pill-row';
    pills.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.45rem; align-items: center;';
    row.appendChild(pills);

    return row;
}

function makeUtilBtn(label, action, parent) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `
        padding: 3px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 600;
        cursor: pointer; border: 2px solid var(--border-color);
        background: transparent; color: var(--text-secondary);
        transition: background 0.2s, color 0.2s;
    `;
    btn.addEventListener('mouseenter', () => { btn.style.background = 'var(--border-color)'; btn.style.color = '#fff'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; btn.style.color = 'var(--text-secondary)'; });
    btn.addEventListener('click', action);
    if (parent) parent.appendChild(btn);
    return btn;
}

function pillStyle(color, active) {
    return `
        display: inline-flex; align-items: center; gap: 6px; padding: 5px 13px;
        border-radius: 20px; cursor: pointer; font-size: 0.82rem; font-weight: 600;
        user-select: none; border: 2px solid ${color};
        background-color: ${active ? color : 'transparent'};
        color: ${active ? '#fff' : color};
        transition: background-color 0.2s, color 0.2s;
    `;
}

function styleMethodPill(label, active, color) {
    label.style.backgroundColor = active ? color : 'transparent';
    label.style.color           = active ? '#fff' : color;
}

function metricPillStyle(color, active) {
    return `
        display: inline-flex; align-items: center; gap: 6px; padding: 5px 13px;
        border-radius: 20px; cursor: pointer; font-size: 0.82rem; font-weight: 600;
        user-select: none; border: 2px solid ${color};
        background-color: ${active ? color : 'transparent'};
        color: ${active ? '#fff' : color};
        transition: background-color 0.2s, color 0.2s;
    `;
}

function syncMethodPills() {
    document.querySelectorAll('#fines-controls-wrapper [data-method]').forEach(label => {
        const key   = label.dataset.method;
        const cb    = label.querySelector('input');
        if (!cb) return;
        cb.checked  = selectedMethods.has(key);
        const color = key === 'Police' ? 'var(--police-color)' : 'var(--camera-color)';
        styleMethodPill(label, cb.checked, color);
    });
}

// ─── Tooltip builder — always shows all three metrics ─────────────────────────

function buildTooltip(d) {
    return (
        '<strong>' + (jurisdictionNames[d.jur] || d.jur) + ' \u2014 ' + d.year + '</strong><br>' +
        '📋 Fines: '    + formatNumber(d.fines)   + '<br>' +
        '⚖️ Charges: '  + formatNumber(d.charges) + '<br>' +
        '🚔 Arrests: '  + formatNumber(d.arrests)
    );
}

// ─── Heatmap renderer ─────────────────────────────────────────────────────────

function renderHeatmap(containerId) {
    const container = document.getElementById(containerId);
    d3.select('#' + containerId).selectAll('*').remove();

    // Fetch data for all jurisdictions
    const activeMethods = [...selectedMethods];
    const rawTrends     = getYearlyTrends(ALL_JURISDICTIONS, activeMethods.length < 2 ? activeMethods : undefined);

    // Update story panel — national view so no single-jurisdiction note, just method notes
    renderStory('fines-story-panel', getFinesStory(activeMethods, ALL_YEARS), getDataNotes(null, activeMethods));

    // Build lookup: jurisdiction → year → { fines, charges, arrests }
    const dataMap = new Map();
    ALL_JURISDICTIONS.forEach(j => dataMap.set(j, new Map()));

    rawTrends.forEach(d => {
        if (!dataMap.has(d.jurisdiction)) return;
        const existing = dataMap.get(d.jurisdiction).get(d.year) || { fines: 0, charges: 0, arrests: 0 };
        existing.fines   += d.fines;
        existing.charges += d.charges;
        existing.arrests += d.arrests;
        dataMap.get(d.jurisdiction).set(d.year, existing);
    });

    // Flat cell array — value = sum of all selected metrics
    const activeMetrics = [...selectedMetrics];
    const cells = [];
    ALL_JURISDICTIONS.forEach(jur => {
        ALL_YEARS.forEach(year => {
            const vals = dataMap.get(jur).get(year) || { fines: 0, charges: 0, arrests: 0 };
            const cellValue = activeMetrics.reduce((sum, m) => sum + (vals[m] || 0), 0);
            cells.push({ jur, year, cellValue, fines: vals.fines, charges: vals.charges, arrests: vals.arrests });
        });
    });

    const metricMax = d3.max(cells, d => d.cellValue) || 1;

    // ── Layout ────────────────────────────────────────────────────────────
    const containerW = container.clientWidth || 900;
    const margin     = { top: 90, right: 180, bottom: 60, left: 100 };
    const innerW     = containerW - margin.left - margin.right;
    const cellW      = Math.max(18, Math.floor(innerW / ALL_YEARS.length));
    const cellH      = Math.max(28, Math.floor(Math.min(62, (containerW * 0.4) / ALL_JURISDICTIONS.length)));
    const innerH     = cellH * ALL_JURISDICTIONS.length;
    const svgH       = innerH + margin.top + margin.bottom;

    // ── Colour scale — sequential, 9-step ────────────────────────────────
    // Camera era dominates NSW — use log scale for perceptual balance
    const colorScale = d3.scaleSequentialLog()
        .domain([1, metricMax])
        .interpolator(d3.interpolateInferno)
        .clamp(true);

    // For cells with 0 value use a near-black background
    const zeroColor  = '#0f0f1e';

    // ── SVG ──────────────────────────────────────────────────────────────
    const svg = d3.select('#' + containerId)
        .append('svg')
        .attr('width', containerW)
        .attr('height', svgH);

    const g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // ── Scales ───────────────────────────────────────────────────────────
    const xScale = d3.scaleBand().domain(ALL_YEARS).range([0, cellW * ALL_YEARS.length]).padding(0.05);
    const yScale = d3.scaleBand().domain(ALL_JURISDICTIONS).range([0, innerH]).padding(0.08);

    // ── Title ─────────────────────────────────────────────────────────────
    const metricLabels = { fines: 'Fines', charges: 'Charges', arrests: 'Arrests' };
    const metricLabel  = activeMetrics.map(m => metricLabels[m]).join(' + ');
    g.append('text')
        .attr('x', (cellW * ALL_YEARS.length) / 2)
        .attr('y', -margin.top + 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', '700')
        .style('fill', 'var(--text-primary)')
        .text('Mobile Phone Enforcement Heatmap (2008–2024)');

    g.append('text')
        .attr('x', (cellW * ALL_YEARS.length) / 2)
        .attr('y', -margin.top + 30)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', 'var(--text-secondary)')
        .text('Colour intensity = ' + metricLabel + '  ·  ' + activeMethods.join(' + ') + ' detection');

    // ── Cells ─────────────────────────────────────────────────────────────
    const cellG = g.selectAll('.cell-g')
        .data(cells)
        .join('g')
        .attr('class', 'cell-g')
        .attr('transform', d => 'translate(' + xScale(d.year) + ',' + yScale(d.jur) + ')');

    cellG.append('rect')
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('rx', 3)
        .attr('fill', d => d.cellValue > 0 ? colorScale(d.cellValue) : zeroColor)
        .attr('stroke', 'rgba(0,0,0,0.15)')
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .on('mouseover', function (event, d) {
            d3.select(this).attr('stroke', 'white').attr('stroke-width', 2);
            showTooltip(buildTooltip(d), event);
        })
        .on('mousemove', function (event, d) { showTooltip(buildTooltip(d), event); })
        .on('mouseout', function () {
            d3.select(this).attr('stroke', 'rgba(0,0,0,0.15)').attr('stroke-width', 0.5);
            hideTooltip();
        });

    // Value labels inside cells (only if wide enough)
    if (xScale.bandwidth() >= 30) {
        cellG.append('text')
            .attr('x', xScale.bandwidth() / 2)
            .attr('y', yScale.bandwidth() / 2 + 4)
            .attr('text-anchor', 'middle')
            .style('font-size', Math.min(10, xScale.bandwidth() * 0.28) + 'px')
            .style('font-weight', '600')
            .style('pointer-events', 'none')
            .style('fill', d => {
                if (d.cellValue === 0) return 'var(--border-color)';
                const norm = Math.log(d.cellValue) / Math.log(metricMax);
                return norm > 0.55 ? '#111' : 'rgba(255,255,255,0.85)';
            })
            .text(d => d.cellValue > 0 ? formatNumber(d.cellValue) : '');
    }

    // ── X axis (years) ────────────────────────────────────────────────────
    const xAxisG = g.append('g')
        .attr('transform', 'translate(0,' + innerH + ')')
        .call(
            d3.axisBottom(xScale)
                .tickFormat(d3.format('d'))
                .tickSize(4)
        );
    xAxisG.selectAll('text')
        .style('font-size', '11px')
        .attr('transform', 'rotate(-35)')
        .attr('text-anchor', 'end')
        .attr('dx', '-0.4em')
        .attr('dy', '0.1em');
    xAxisG.select('.domain').attr('stroke', 'var(--border-color)');
    xAxisG.selectAll('line').attr('stroke', 'var(--border-color)');

    g.append('text')
        .attr('x', (cellW * ALL_YEARS.length) / 2)
        .attr('y', innerH + 52)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px')
        .style('font-weight', '600')
        .style('fill', 'currentColor')
        .text('Year');

    // ── Y axis (jurisdictions) ────────────────────────────────────────────
    const yAxisG = g.append('g')
        .call(
            d3.axisLeft(yScale)
                .tickFormat(d => jurisdictionNames[d] ? jurisdictionNames[d].replace(' of ', ' of\u00A0') : d)
                .tickSize(4)
        );
    yAxisG.selectAll('text')
        .style('font-size', '11px')
        .style('fill', 'var(--text-primary)');
    yAxisG.select('.domain').attr('stroke', 'var(--border-color)');
    yAxisG.selectAll('line').attr('stroke', 'var(--border-color)');

    // ── Colour legend (vertical gradient) ────────────────────────────────
    const legendH   = Math.min(innerH * 0.7, 180);
    const legendW   = 14;
    const legendX   = cellW * ALL_YEARS.length + 24;
    const legendY   = (innerH - legendH) / 2;
    const defs      = svg.append('defs');
    const gradId    = 'heatmap-gradient';
    const grad      = defs.append('linearGradient')
        .attr('id', gradId)
        .attr('x1', '0%').attr('y1', '100%')
        .attr('x2', '0%').attr('y2', '0%');

    const stops = d3.range(0, 1.01, 0.1);
    stops.forEach(t => {
        const val = Math.exp(t * Math.log(metricMax));
        grad.append('stop')
            .attr('offset', (t * 100) + '%')
            .attr('stop-color', colorScale(Math.max(val, 1)));
    });

    const legG = g.append('g').attr('transform', 'translate(' + legendX + ',' + legendY + ')');

    legG.append('rect')
        .attr('width', legendW)
        .attr('height', legendH)
        .attr('rx', 3)
        .attr('fill', 'url(#' + gradId + ')');

    // Legend axis
    const legScale = d3.scaleLog()
        .domain([1, metricMax])
        .range([legendH, 0])
        .clamp(true);

    // Cap tick count so labels don't collide when metricMax is small.
    // A log scale needs ~1 order of magnitude per tick to avoid crowding.
    const decades   = Math.log10(Math.max(metricMax, 10));
    const tickCount = Math.max(2, Math.min(5, Math.floor(decades)));
    const legAxis = d3.axisRight(legScale)
        .ticks(tickCount, '~s')
        .tickFormat(formatNumber)
        .tickSize(4);

    const legAxisG = legG.append('g')
        .attr('transform', 'translate(' + legendW + ',0)')
        .call(legAxis);
    legAxisG.selectAll('text').style('font-size', '10px').style('fill', 'var(--text-secondary)');
    legAxisG.select('.domain').attr('stroke', 'var(--border-color)');
    legAxisG.selectAll('line').attr('stroke', 'var(--border-color)');

    legG.append('text')
        .attr('x', legendW / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-weight', '700')
        .style('fill', 'var(--text-secondary)')
        .text(metricLabel);

    // Zero indicator
    legG.append('rect')
        .attr('x', 0).attr('y', legendH + 10)
        .attr('width', legendW).attr('height', legendW)
        .attr('fill', zeroColor)
        .attr('stroke', 'var(--border-color)')
        .attr('stroke-width', 1)
        .attr('rx', 2);
    legG.append('text')
        .attr('x', legendW + 5).attr('y', legendH + 10 + legendW / 2 + 4)
        .style('font-size', '10px').style('fill', 'var(--text-secondary)')
        .text('No data');
}