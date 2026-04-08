// ===========================
// Historical Trend Chart
// ===========================

import { config, jurisdictionNames } from '../modules/config.js';
import { getYearlyTrends, filterData } from '../utils/dataLoader.js';
import { formatNumber, getChartDimensions } from '../utils/helpers.js';
import { showTooltip, hideTooltip } from '../utils/tooltip.js';
import { renderStory, ensureStoryPanel, getTrendStory, getDataNotes } from './storyTelling.js';

let selectedJurisdictions = new Set(['NSW', 'VIC', 'QLD']);
let selectedMethods = new Set(['Police', 'Camera']);

const ALL_JURISDICTIONS = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

export function createHistoricalTrendChart(containerId = 'trend-chart', controlsId = 'jurisdiction-controls') {
    ensureStoryPanel('trend', 'trend-story-panel', 'trend-chart');
    initializeControls(controlsId);
    initializeMethodControls();
    updateTrendChart(containerId);
}

function initializeMethodControls() {
    if (document.getElementById('method-filter-controls')) return;

    const panel = document.querySelector('#trend .controls-panel');
    if (!panel) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'method-filter-controls';
    wrapper.style.cssText = 'margin-bottom: 1rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;';

    const heading = document.createElement('h4');
    heading.textContent = 'Filter by Detection Method:';
    heading.style.cssText = 'margin: 0 0.75rem 0 0; font-size: 0.9rem; color: var(--text-primary); white-space: nowrap;';
    wrapper.appendChild(heading);

    const pillRow = document.createElement('div');
    pillRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.5rem;';
    wrapper.appendChild(pillRow);

    [
        { key: 'Police', color: 'var(--police-color)', icon: '👮' },
        { key: 'Camera', color: 'var(--camera-color)', icon: '📷' },
    ].forEach(({ key, color, icon }) => {
        const label = document.createElement('label');
        label.style.cssText = `
            display: inline-flex; align-items: center; gap: 6px;
            padding: 6px 14px; border-radius: 20px; cursor: pointer;
            font-size: 0.85rem; font-weight: 600; user-select: none;
            border: 2px solid ${color}; background-color: ${color}; color: #fff;
            transition: background-color 0.2s, opacity 0.2s;
        `;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; checkbox.checked = selectedMethods.has(key);
        checkbox.style.display = 'none';

        const applyStyle = (checked) => {
            label.style.backgroundColor = checked ? color : 'transparent';
            label.style.color           = checked ? '#fff' : color;
        };
        applyStyle(checkbox.checked);

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) { selectedMethods.add(key); }
            else {
                if (selectedMethods.size === 1) { checkbox.checked = true; return; }
                selectedMethods.delete(key);
            }
            applyStyle(checkbox.checked);
            updateTrendChart('trend-chart');
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(icon + ' ' + key));
        pillRow.appendChild(label);
    });

    const firstH4 = panel.querySelector('h4');
    panel.insertBefore(wrapper, firstH4);
}

function initializeControls(controlsId) {
    const controlsContainer = d3.select('#' + controlsId);
    controlsContainer.selectAll('*').remove();

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;';

    [
        { label: 'Select All', action: () => { selectedJurisdictions = new Set(ALL_JURISDICTIONS); rebuildPills(controlsId); updateTrendChart('trend-chart'); } },
        { label: 'Clear All',  action: () => { selectedJurisdictions.clear(); rebuildPills(controlsId); updateTrendChart('trend-chart'); } },
    ].forEach(({ label, action }) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = `
            padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;
            cursor: pointer; border: 2px solid var(--secondary-color);
            background: transparent; color: var(--secondary-color);
            transition: background 0.2s, color 0.2s;
        `;
        btn.addEventListener('mouseenter', () => { btn.style.background = 'var(--secondary-color)'; btn.style.color = '#fff'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; btn.style.color = 'var(--secondary-color)'; });
        btn.addEventListener('click', action);
        btnRow.appendChild(btn);
    });

    const controlsEl = document.getElementById(controlsId);
    controlsEl.parentElement.insertBefore(btnRow, controlsEl);

    rebuildPills(controlsId);
}

function rebuildPills(controlsId) {
    const controlsContainer = d3.select('#' + controlsId);
    controlsContainer.selectAll('*').remove();

    const labels = controlsContainer
        .selectAll('.jurisdiction-checkbox')
        .data(ALL_JURISDICTIONS)
        .join('label')
        .attr('class', d => selectedJurisdictions.has(d) ? 'jurisdiction-checkbox checked' : 'jurisdiction-checkbox')
        .on('change', function(event, d) {
            if (event.target.checked) { selectedJurisdictions.add(d); this.classList.add('checked'); }
            else { selectedJurisdictions.delete(d); this.classList.remove('checked'); }
            updateTrendChart('trend-chart');
        });

    labels.append('input')
        .attr('type', 'checkbox')
        .property('checked', d => selectedJurisdictions.has(d));

    labels.append('span').text(d => d);
}

function updateTrendChart(containerId) {
    const container = document.getElementById(containerId);
    const dims = getChartDimensions(container, config.margin);

    d3.select('#' + containerId).selectAll('*').remove();

    const jurArr        = [...selectedJurisdictions];
    const activeMethods = [...selectedMethods];

    // ── Story + data notes ────────────────────────────────────────────────
    // For multi-jurisdiction selections use notes from the first selected;
    // for single selections use that jurisdiction's specific notes.
    const notesJur = jurArr.length === 1 ? jurArr[0] : null;
    renderStory(
        'trend-story-panel',
        getTrendStory(jurArr),
        notesJur ? getDataNotes(notesJur, activeMethods) : getMethodNotes(activeMethods)
    );

    if (selectedJurisdictions.size === 0) {
        d3.select('#' + containerId).append('p').attr('class', 'empty-state')
            .style('text-align', 'center').style('padding', '50px').style('color', '#7f8c8d')
            .text('Please select at least one jurisdiction to display');
        return;
    }

    const methodFilter = [...selectedMethods];
    const trendData = getYearlyTrends([...selectedJurisdictions], methodFilter);

    const grouped = d3.group(trendData, d => d.jurisdiction);
    const lineData = Array.from(grouped, ([jurisdiction, values]) => ({
        jurisdiction,
        values: values.sort((a, b) => a.year - b.year)
    }));

    const methodLabel = methodFilter.length === 2 ? 'Police + Camera'
        : methodFilter[0] === 'Police' ? '👮 Police only' : '📷 Camera only';

    const svg = d3.select('#' + containerId)
        .append('svg').attr('width', dims.width).attr('height', dims.height);

    const g = svg.append('g')
        .attr('transform', 'translate(' + config.margin.left + ',' + config.margin.top + ')');

    g.append('text').attr('x', dims.innerWidth / 2).attr('y', -18)
        .attr('text-anchor', 'middle').style('font-size', '12px').style('fill', 'var(--text-secondary)')
        .text('Showing: ' + methodLabel);

    const presentYears = [...new Set(trendData.map(d => d.year))].sort((a, b) => a - b);
    const xScale = d3.scalePoint().domain(presentYears).range([0, dims.innerWidth]).padding(0.3);
    const yScale = d3.scaleLinear().domain([0, d3.max(trendData, d => d.fines) || 1]).nice().range([dims.innerHeight, 0]);

    g.append('g').attr('class', 'grid').attr('opacity', 0.1)
        .call(d3.axisLeft(yScale).tickSize(-dims.innerWidth).tickFormat(''));

    const xAxis = g.append('g').attr('class', 'axis')
        .attr('transform', 'translate(0,' + dims.innerHeight + ')')
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')));
    xAxis.append('text').attr('x', dims.innerWidth / 2).attr('y', 40).attr('fill', 'currentColor')
        .style('font-size', '14px').style('font-weight', '600').style('text-anchor', 'middle').text('Year');

    const yAxis = g.append('g').attr('class', 'axis')
        .call(d3.axisLeft(yScale).tickFormat(d => formatNumber(d)));
    yAxis.append('text').attr('transform', 'rotate(-90)').attr('x', -dims.innerHeight / 2).attr('y', -60)
        .attr('fill', 'currentColor').style('font-size', '14px').style('font-weight', '600')
        .style('text-anchor', 'middle').text('Number of Fines');

    const line = d3.line()
        .x(d => xScale(d.year)).y(d => yScale(d.fines)).curve(d3.curveMonotoneX);

    const lines = g.selectAll('.line-group').data(lineData).join('g').attr('class', 'line-group');

    lines.append('path').attr('class', 'line')
        .attr('d', d => line(d.values))
        .attr('stroke', d => config.colors.jurisdictions[d.jurisdiction])
        .attr('stroke-width', 2.5).attr('fill', 'none').style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('stroke-width', 4).raise();
            showTooltip('<strong>' + (jurisdictionNames[d.jurisdiction] || d.jurisdiction) + '</strong>', event);
        })
        .on('mousemove', function(event) {
            showTooltip('<strong>' + (jurisdictionNames[this.__data__.jurisdiction] || this.__data__.jurisdiction) + '</strong>', event);
        })
        .on('mouseout', function() { d3.select(this).attr('stroke-width', 2.5); hideTooltip(); });

    lines.each(function(ld) {
        d3.select(this).selectAll('.dot').data(ld.values).join('circle').attr('class', 'dot')
            .attr('cx', d => xScale(d.year)).attr('cy', d => yScale(d.fines))
            .attr('r', 4).attr('fill', config.colors.jurisdictions[ld.jurisdiction])
            .attr('stroke', 'white').attr('stroke-width', 2).style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this).attr('r', 6);
                showTooltip('<strong>' + (jurisdictionNames[ld.jurisdiction] || ld.jurisdiction) + ' - ' + d.year + '</strong><br>Fines: ' + formatNumber(d.fines) + '<br>Charges: ' + formatNumber(d.charges) + '<br>Arrests: ' + formatNumber(d.arrests), event);
            })
            .on('mousemove', function(event, d) {
                showTooltip('<strong>' + (jurisdictionNames[ld.jurisdiction] || ld.jurisdiction) + ' - ' + d.year + '</strong><br>Fines: ' + formatNumber(d.fines) + '<br>Charges: ' + formatNumber(d.charges) + '<br>Arrests: ' + formatNumber(d.arrests), event);
            })
            .on('mouseout', function() { d3.select(this).attr('r', 4); hideTooltip(); });
    });

    const x2020 = xScale(2020);
    if (x2020 !== undefined) {
        g.append('text').attr('class', 'annotation-text').attr('x', x2020 - 20).attr('y', 12)
            .attr('fill', '#e74c3c').style('font-size', '12px').style('font-weight', '600').text('Camera introduction');
        g.append('line').attr('class', 'annotation-line')
            .attr('x1', x2020).attr('y1', 0).attr('x2', x2020).attr('y2', dims.innerHeight)
            .attr('stroke', '#e74c3c').attr('stroke-width', 2).attr('stroke-dasharray', '5,5');
        g.append('polygon')
            .attr('points', (x2020 - 5) + ',' + (dims.innerHeight - 10) + ' ' + (x2020 + 5) + ',' + (dims.innerHeight - 10) + ' ' + x2020 + ',' + dims.innerHeight)
            .attr('fill', '#e74c3c');
    }

    const legendDiv = d3.select('#' + containerId).append('div').attr('class', 'chart-legend-html')
        .style('display', 'flex').style('flex-wrap', 'wrap').style('gap', '12px')
        .style('justify-content', 'center').style('padding', '12px 0 4px 0').style('margin-top', '8px');

    lineData.forEach(d => {
        const item = legendDiv.append('div').style('display', 'flex').style('align-items', 'center')
            .style('gap', '6px').style('cursor', 'pointer');
        item.append('div').style('width', '18px').style('height', '18px').style('border-radius', '3px')
            .style('background-color', config.colors.jurisdictions[d.jurisdiction]).style('flex-shrink', '0');
        item.append('span').style('font-size', '13px').style('color', 'var(--text-primary)').text(d.jurisdiction);
    });
}

// Return method-level notes when multiple jurisdictions are selected
function getMethodNotes(activeMethods) {
    const METHOD_NOTES = {
        Camera: [
            '📷 Camera fines are detected automatically the driver is not stopped. Detection method varies by state (fixed, mobile, average speed, red-light).',
            '⚠️ Not all states report camera fines publicly NSW camera fines are collected by NSW Revenue, not NSW Police.',
        ],
        Police: [
            '👮 Police-issued fines require an officer to stop the vehicle. Volumes have declined nationally since 2012 as camera enforcement expanded.',
            '🔢 Arrests are generally not applicable for NSW and Tasmania blank values mean the measure does not apply.',
        ],
    };
    const notes = [];
    activeMethods.forEach(m => { if (METHOD_NOTES[m]) notes.push(...METHOD_NOTES[m]); });
    return notes;
}

export function getSelectedJurisdictions() { return new Set(selectedJurisdictions); }