// ===========================
// Fines Histogram Chart
// ===========================

import { config } from '../modules/config.js';
import { getYearlyTrendsByMethod } from '../utils/dataLoader.js';
import { formatNumber } from '../utils/helpers.js';
import { showTooltip, hideTooltip } from '../utils/tooltip.js';
import { renderStory, ensureStoryPanel, getFinesStory } from './storyTelling.js';

const ALL_YEARS = d3.range(2008, 2025);

let selectedMethods = new Set(['Police', 'Camera']);
let yearRangeMin    = 2008;
let yearRangeMax    = 2024;
let selectedYears   = new Set(ALL_YEARS);

export function createFinesHistogram(containerId = 'fines-chart') {
    ensureStoryPanel('fines', 'fines-story-panel', containerId);
    injectControls(containerId);
    renderHistogram(containerId);
}

function injectControls(containerId) {
    if (document.getElementById('fines-controls-wrapper')) return;

    const chartDiv   = document.getElementById(containerId);
    const wrapper    = document.createElement('div');
    wrapper.id       = 'fines-controls-wrapper';
    wrapper.style.cssText = 'margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 1rem;';

    // ── Method pills + Select All / Clear All ──────────────────────────────
    const methodRow = document.createElement('div');
    methodRow.style.cssText = 'display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;';

    const methodHeading = document.createElement('span');
    methodHeading.textContent = 'Detection method:';
    methodHeading.style.cssText = 'font-size: 0.9rem; font-weight: 600; color: var(--text-primary); white-space: nowrap;';
    methodRow.appendChild(methodHeading);

    const methodPills = document.createElement('div');
    methodPills.style.cssText = 'display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;';

    // Select All / Clear All for methods
    [
        { label: 'All',   action: () => { selectedMethods = new Set(['Police','Camera']); syncMethodPills(); renderHistogram(containerId); } },
        { label: 'Clear', action: () => { /* must keep one */ } },
    ].forEach(({ label, action }) => {
        const btn = makeUtilBtn(label, action);
        methodPills.appendChild(btn);
    });

    [
        { key: 'Police', color: 'var(--police-color)', icon: '👮' },
        { key: 'Camera', color: 'var(--camera-color)', icon: '📷' },
    ].forEach(({ key, color, icon }) => {
        const label = document.createElement('label');
        label.dataset.method = key;
        label.style.cssText = `
            display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px;
            border-radius: 20px; cursor: pointer; font-size: 0.85rem; font-weight: 600;
            user-select: none; border: 2px solid ${color}; background-color: ${color}; color: #fff;
            transition: background-color 0.2s, color 0.2s;
        `;
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.checked = true; cb.style.display = 'none';
        cb.id = 'fines-method-' + key;

        const applyStyle = checked => {
            label.style.backgroundColor = checked ? color : 'transparent';
            label.style.color           = checked ? '#fff' : color;
        };

        cb.addEventListener('change', () => {
            if (cb.checked) { selectedMethods.add(key); }
            else { if (selectedMethods.size === 1) { cb.checked = true; return; } selectedMethods.delete(key); }
            applyStyle(cb.checked);
            renderHistogram(containerId);
        });

        label.appendChild(cb);
        label.appendChild(document.createTextNode(icon + ' ' + key));
        methodPills.appendChild(label);
    });

    methodRow.appendChild(methodPills);
    wrapper.appendChild(methodRow);

    // ── Year range sliders ─────────────────────────────────────────────────
    const rangeRow = document.createElement('div');
    rangeRow.style.cssText = 'display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;';

    const rangeHeading = document.createElement('span');
    rangeHeading.textContent = 'Year range:';
    rangeHeading.style.cssText = 'font-size: 0.9rem; font-weight: 600; color: var(--text-primary); white-space: nowrap;';

    const minSlider = Object.assign(document.createElement('input'), { type: 'range', min: 2008, max: 2024, value: yearRangeMin, id: 'fines-year-min' });
    const maxSlider = Object.assign(document.createElement('input'), { type: 'range', min: 2008, max: 2024, value: yearRangeMax, id: 'fines-year-max' });
    [minSlider, maxSlider].forEach(s => s.style.cssText = 'width: 140px; accent-color: var(--secondary-color);');

    const rangeLabel = document.createElement('span');
    rangeLabel.id = 'fines-range-label';
    rangeLabel.style.cssText = 'font-size: 0.85rem; color: var(--text-secondary); white-space: nowrap; min-width: 90px;';
    rangeLabel.textContent = yearRangeMin + ' \u2013 ' + yearRangeMax;

    const updateRange = () => {
        let mn = +minSlider.value, mx = +maxSlider.value;
        if (mn > mx) [mn, mx] = [mx, mn];
        yearRangeMin = mn; yearRangeMax = mx;
        rangeLabel.textContent = mn + ' \u2013 ' + mx;
        selectedYears = new Set(d3.range(mn, mx + 1));
        syncYearPills();
        renderHistogram(containerId);
    };
    minSlider.addEventListener('input', updateRange);
    maxSlider.addEventListener('input', updateRange);

    rangeRow.append(rangeHeading, minSlider, rangeLabel, maxSlider);
    wrapper.appendChild(rangeRow);

    // ── Individual year toggles ────────────────────────────────────────────
    const yearRow = document.createElement('div');
    yearRow.style.cssText = 'display: flex; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;';

    const yearHeading = document.createElement('span');
    yearHeading.textContent = 'Select years:';
    yearHeading.style.cssText = 'font-size: 0.9rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; padding-top: 4px;';

    // Select All / Clear All for years
    const yearBtnRow = document.createElement('div');
    yearBtnRow.style.cssText = 'display: flex; flex-direction: column; gap: 0.35rem;';

    const yearActionRow = document.createElement('div');
    yearActionRow.style.cssText = 'display: flex; gap: 0.4rem;';
    [
        { label: 'All',   action: () => { selectedYears = new Set(d3.range(yearRangeMin, yearRangeMax + 1)); syncYearPills(); renderHistogram(containerId); } },
        { label: 'Clear', action: () => {
            // Keep only the first in-range year
            const first = ALL_YEARS.find(y => y >= yearRangeMin && y <= yearRangeMax);
            selectedYears = new Set(first ? [first] : [yearRangeMin]);
            syncYearPills(); renderHistogram(containerId);
        }},
    ].forEach(({ label, action }) => yearActionRow.appendChild(makeUtilBtn(label, action)));

    const yearPillContainer = document.createElement('div');
    yearPillContainer.id = 'fines-year-pills';
    yearPillContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.4rem;';

    yearBtnRow.append(yearActionRow, yearPillContainer);
    yearRow.append(yearHeading, yearBtnRow);
    wrapper.appendChild(yearRow);

    chartDiv.parentElement.insertBefore(wrapper, chartDiv);
    buildYearPills(containerId);
}

function makeUtilBtn(label, action) {
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
    return btn;
}

function buildYearPills(containerId) {
    const container = document.getElementById('fines-year-pills');
    if (!container) return;
    container.innerHTML = '';

    ALL_YEARS.forEach(year => {
        const inRange = year >= yearRangeMin && year <= yearRangeMax;
        const label = document.createElement('label');
        label.dataset.year = year;
        label.style.cssText = `
            display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 20px;
            cursor: pointer; font-size: 0.8rem; font-weight: 600; user-select: none;
            border: 2px solid var(--secondary-color);
            transition: background-color 0.15s, color 0.15s, opacity 0.15s;
        `;
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.checked = inRange && selectedYears.has(year); cb.style.display = 'none';

        const applyStyle = (checked, disabled) => {
            label.style.opacity       = disabled ? '0.3' : '1';
            label.style.pointerEvents = disabled ? 'none' : 'auto';
            label.style.backgroundColor = (checked && !disabled) ? 'var(--secondary-color)' : 'transparent';
            label.style.color           = (checked && !disabled) ? '#fff' : 'var(--secondary-color)';
        };
        applyStyle(cb.checked, !inRange);

        cb.addEventListener('change', () => {
            if (cb.checked) { selectedYears.add(year); }
            else { if (selectedYears.size === 1) { cb.checked = true; return; } selectedYears.delete(year); }
            applyStyle(cb.checked, false);
            renderHistogram(containerId);
        });

        label.appendChild(cb);
        label.appendChild(document.createTextNode(year));
        container.appendChild(label);
    });
}

function syncYearPills() {
    document.querySelectorAll('#fines-year-pills label').forEach(label => {
        const year = +label.dataset.year;
        const inRange = year >= yearRangeMin && year <= yearRangeMax;
        const cb = label.querySelector('input');
        cb.checked = selectedYears.has(year);
        label.style.opacity       = inRange ? '1' : '0.3';
        label.style.pointerEvents = inRange ? 'auto' : 'none';
        label.style.backgroundColor = (cb.checked && inRange) ? 'var(--secondary-color)' : 'transparent';
        label.style.color           = (cb.checked && inRange) ? '#fff' : 'var(--secondary-color)';
    });
}

function syncMethodPills() {
    document.querySelectorAll('[data-method]').forEach(label => {
        const key = label.dataset.method;
        if (!label.closest('#fines-controls-wrapper')) return;
        const cb = label.querySelector('input');
        if (!cb) return;
        cb.checked = selectedMethods.has(key);
        const color = key === 'Police' ? 'var(--police-color)' : 'var(--camera-color)';
        label.style.backgroundColor = cb.checked ? color : 'transparent';
        label.style.color           = cb.checked ? '#fff' : color;
    });
}

function renderHistogram(containerId) {
    const container = document.getElementById(containerId);
    d3.select('#' + containerId).selectAll('*').remove();

    const aggregated    = getYearlyTrendsByMethod([2008, 2024]);
    const activeMethods = [...selectedMethods];
    const visibleYears  = ALL_YEARS.filter(y => y >= yearRangeMin && y <= yearRangeMax && selectedYears.has(y));

    // Update story
    renderStory('fines-story-panel', getFinesStory(activeMethods, visibleYears));

    if (visibleYears.length === 0) {
        d3.select('#' + containerId).append('p')
            .style('text-align', 'center').style('padding', '60px').style('color', 'var(--text-secondary)')
            .text('No years selected. Pick at least one year above.');
        return;
    }

    const stackData = visibleYears.map(year => {
        const polRow = aggregated.find(d => d.year === year && d.detectionMethod === 'Police');
        const camRow = aggregated.find(d => d.year === year && d.detectionMethod === 'Camera');
        const police = (activeMethods.includes('Police') && polRow) ? polRow.fines : 0;
        const camera = (activeMethods.includes('Camera') && camRow) ? camRow.fines : 0;
        return { year, police, camera, total: police + camera };
    });

    const totalPolice = d3.sum(stackData, d => d.police);
    const totalCamera = d3.sum(stackData, d => d.camera);
    const grandTotal  = totalPolice + totalCamera;

    const margin  = { top: 110, right: 30, bottom: 70, left: 90 };
    const width   = container.clientWidth || 900;
    const height  = Math.max(480, Math.min(580, width * 0.52));
    const innerW  = width  - margin.left - margin.right;
    const innerH  = height - margin.top  - margin.bottom;

    const xScale = d3.scaleBand().domain(visibleYears).range([0, innerW])
        .padding(visibleYears.length < 6 ? 0.35 : 0.18);
    const yMax   = d3.max(stackData, d => d.total) || 1;
    const yScale = d3.scaleLinear().domain([0, yMax * 1.12]).nice().range([innerH, 0]);
    const stack  = d3.stack().keys(['police', 'camera']);
    const series = stack(stackData);

    const svg = d3.select('#' + containerId).append('svg').attr('width', width).attr('height', height);
    const g   = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Title
    g.append('text').attr('x', innerW / 2).attr('y', -82).attr('text-anchor', 'middle')
        .style('font-size', '16px').style('font-weight', '700').style('fill', 'var(--text-primary)')
        .text('Total Fines Issued Across Australia (2008\u20132024)');
    g.append('text').attr('x', innerW / 2).attr('y', -62).attr('text-anchor', 'middle')
        .style('font-size', '12px').style('fill', 'var(--text-secondary)')
        .text('All jurisdictions combined \u00b7 stacked by detection method');

    // ── Summary totals ────────────────────────────────────────────────────────
    const summaryParts = [];
    if (activeMethods.includes('Police') && totalPolice > 0)
        summaryParts.push({ label: '👮 Police', value: totalPolice, color: config.colors.police });
    if (activeMethods.includes('Camera') && totalCamera > 0)
        summaryParts.push({ label: '📷 Camera', value: totalCamera, color: config.colors.camera });
    summaryParts.push({ label: 'Grand Total', value: grandTotal, color: 'var(--text-primary)' });

    const sumY = -46;
    const partW = innerW / summaryParts.length;
    summaryParts.forEach((part, i) => {
        const cx = partW * i + partW / 2;
        g.append('text').attr('x', cx).attr('y', sumY).attr('text-anchor', 'middle')
            .style('font-size', '11px').style('fill', part.color).style('font-weight', '600')
            .text(part.label);
        g.append('text').attr('x', cx).attr('y', sumY + 18).attr('text-anchor', 'middle')
            .style('font-size', '15px').style('fill', part.color).style('font-weight', '700')
            .text(formatNumber(part.value));
    });

    g.append('line').attr('x1', 0).attr('x2', innerW).attr('y1', sumY + 26).attr('y2', sumY + 26)
        .attr('stroke', 'var(--border-color)').attr('stroke-opacity', 0.4);

    // Grid
    g.append('g').attr('class', 'grid').attr('opacity', 0.1)
        .call(d3.axisLeft(yScale).tickSize(-innerW).tickFormat(''));

    // Stacked bars
    const colors = { police: config.colors.police, camera: config.colors.camera };
    g.selectAll('.series').data(series).join('g').attr('class', 'series')
        .attr('fill', d => colors[d.key])
        .selectAll('rect')
        .data(d => d.map(v => ({ ...v, key: d.key })))
        .join('rect')
        .attr('x', d => xScale(d.data.year)).attr('y', d => yScale(d[1]))
        .attr('height', d => Math.max(0, yScale(d[0]) - yScale(d[1]))).attr('width', xScale.bandwidth())
        .attr('opacity', 0.88).attr('rx', 2)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1);
            const label = d.key === 'police' ? 'Police' : 'Camera';
            const val   = d.key === 'police' ? d.data.police : d.data.camera;
            showTooltip('<strong>' + d.data.year + ' \u2014 ' + label + '</strong><br>Fines: ' + formatNumber(val) + '<br><span style="color:var(--text-secondary)">Total: ' + formatNumber(d.data.total) + '</span>', event);
        })
        .on('mouseout', function() { d3.select(this).attr('opacity', 0.88); hideTooltip(); });

    // Total labels
    g.selectAll('.total-label').data(stackData).join('text').attr('class', 'total-label')
        .attr('x', d => xScale(d.year) + xScale.bandwidth() / 2).attr('y', d => yScale(d.total) - 6)
        .attr('text-anchor', 'middle').style('font-size', '10px').style('font-weight', '600')
        .style('fill', 'var(--text-secondary)').style('pointer-events', 'none')
        .text(d => xScale.bandwidth() >= 24 ? formatNumber(d.total) : '');

    // X axis
    g.append('g').attr('class', 'axis').attr('transform', 'translate(0,' + innerH + ')')
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
        .selectAll('text').style('font-size', '11px').attr('transform', 'rotate(-35)')
        .attr('text-anchor', 'end').attr('dx', '-0.5em').attr('dy', '0.3em');
    g.append('text').attr('x', innerW / 2).attr('y', innerH + 62).attr('text-anchor', 'middle')
        .style('font-size', '13px').style('font-weight', '600').style('fill', 'currentColor').text('Year');

    // Y axis
    g.append('g').attr('class', 'axis').call(d3.axisLeft(yScale).tickFormat(formatNumber));
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -innerH / 2).attr('y', -72)
        .attr('text-anchor', 'middle').style('font-size', '13px').style('font-weight', '600')
        .style('fill', 'currentColor').text('Total Fines Issued');

    // Camera intro annotation
    if (visibleYears.includes(2020)) {
        const x2020 = xScale(2020) + xScale.bandwidth() / 2;
        g.append('line').attr('x1', x2020).attr('x2', x2020).attr('y1', 0).attr('y2', innerH)
            .attr('stroke', '#ff6b9d').attr('stroke-width', 1.5).attr('stroke-dasharray', '5,4').attr('opacity', 0.8);
        g.append('polygon').attr('points', (x2020-5)+',8 '+(x2020+5)+',8 '+x2020+',18')
            .attr('fill', '#ff6b9d').attr('opacity', 0.9);
        g.append('text').attr('x', x2020 - 8).attr('y', 10).attr('text-anchor', 'end')
            .style('font-size', '11px').style('font-weight', '700').style('fill', '#ff6b9d').text('Camera introduced');
    }

    // Peak annotation
    const peakYear = stackData.reduce((p, d) => d.total > p.total ? d : p);
    if (peakYear.total > 0) {
        const xPeak = xScale(peakYear.year) + xScale.bandwidth() / 2;
        g.append('text').attr('x', xPeak).attr('y', yScale(peakYear.total) - 20)
            .attr('text-anchor', 'middle').style('font-size', '10px').style('font-weight', '700')
            .style('fill', '#ffa502').text('\u2605 Peak: ' + formatNumber(peakYear.total));
    }

    // Legend
    const legendDiv = d3.select('#' + containerId).append('div')
        .style('display', 'flex').style('flex-wrap', 'wrap').style('gap', '24px')
        .style('justify-content', 'center').style('padding', '14px 0 4px');

    [
        { label: 'Police (manual detection)',    color: config.colors.police  },
        { label: 'Camera (automated detection)', color: config.colors.camera  },
    ].filter(item => activeMethods.includes(item.label.split(' ')[0]))
    .forEach(item => {
        const el = legendDiv.append('div').style('display', 'flex').style('align-items', 'center').style('gap', '8px');
        el.append('div').style('width', '16px').style('height', '16px').style('border-radius', '3px')
            .style('background-color', item.color).style('opacity', '0.88').style('flex-shrink', '0');
        el.append('span').style('font-size', '13px').style('color', 'var(--text-primary)').text(item.label);
    });
}