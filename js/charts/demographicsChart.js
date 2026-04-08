// ===========================
// Demographics Chart
// Top: grouped bar chart — Police vs Camera fines per age group
// Bottom: grouped bar chart — Police vs Camera charges & arrests per age group
// ===========================

import { config, ageGroupOrder } from '../modules/config.js';
import { getDemographicBreakdown, getDemographicLocationLabel } from '../utils/dataLoader.js';
import { formatNumber, getChartDimensions } from '../utils/helpers.js';
import { showTooltip, hideTooltip } from '../utils/tooltip.js';

const FULL_AGE_ORDER = (() => {
    const order = [...ageGroupOrder];
    if (!order.includes('0-65+')) order.push('0-65+');
    return order;
})();

const INSIDE_LABEL_MIN_PX = 20;
const MIN_VALUE_FOR_LABEL  = 1;

// Module-level state
let showAggregate = false;
let selectedMethods = new Set(['Police', 'Camera']);

export function createDemographicsChart() {
    const jurisdictionSelect = document.getElementById('demo-jurisdiction');
    const yearSelect         = document.getElementById('demo-year');

    injectAggregateToggle();
    injectMethodFilter();

    jurisdictionSelect.addEventListener('change', updateChart);
    yearSelect.addEventListener('change', updateChart);
    updateChart();
}

function injectAggregateToggle() {
    if (document.getElementById('aggregate-toggle-wrapper')) return;

    const panel = document.querySelector('#demographics .controls-panel');
    if (!panel) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'aggregate-toggle-wrapper';
    wrapper.style.cssText = 'margin-top: 1rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;';

    const heading = document.createElement('span');
    heading.textContent = 'Age group filter:';
    heading.style.cssText = 'font-size: 0.9rem; font-weight: 600; color: var(--text-primary); white-space: nowrap;';
    wrapper.appendChild(heading);

    const label = document.createElement('label');
    label.style.cssText = `
        display: inline-flex; align-items: center; gap: 6px;
        padding: 6px 14px; border-radius: 20px; cursor: pointer;
        font-size: 0.85rem; font-weight: 600; user-select: none;
        border: 2px solid var(--text-secondary);
        background-color: transparent;
        color: var(--text-secondary);
        transition: background-color 0.2s, color 0.2s;
    `;
    label.title = 'Include the 0-65+ aggregate row (may overlap with age-specific bars)';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = showAggregate;
    checkbox.style.display = 'none';

    const applyStyle = (checked) => {
        label.style.backgroundColor = checked ? 'var(--secondary-color)' : 'transparent';
        label.style.borderColor     = checked ? 'var(--secondary-color)' : 'var(--text-secondary)';
        label.style.color           = checked ? '#fff' : 'var(--text-secondary)';
    };
    applyStyle(checkbox.checked);

    checkbox.addEventListener('change', () => {
        showAggregate = checkbox.checked;
        applyStyle(checkbox.checked);
        updateChart();
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode('Show 0-65+ aggregate bar'));
    wrapper.appendChild(label);
    panel.appendChild(wrapper);
}

function injectMethodFilter() {
    if (document.getElementById('demo-method-filter-wrapper')) return;

    const panel = document.querySelector('#demographics .controls-panel');
    if (!panel) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'demo-method-filter-wrapper';
    wrapper.style.cssText = 'margin-top: 0.75rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;';

    const heading = document.createElement('span');
    heading.textContent = 'Detection method:';
    heading.style.cssText = 'font-size: 0.9rem; font-weight: 600; color: var(--text-primary); white-space: nowrap;';
    wrapper.appendChild(heading);

    const pillRow = document.createElement('div');
    pillRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.5rem;';
    wrapper.appendChild(pillRow);

    const methods = [
        { key: 'Police', color: 'var(--police-color)', icon: '👮' },
        { key: 'Camera', color: 'var(--camera-color)', icon: '📷' },
    ];

    methods.forEach(({ key, color, icon }) => {
        const label = document.createElement('label');
        label.style.cssText = `
            display: inline-flex; align-items: center; gap: 6px;
            padding: 6px 14px; border-radius: 20px; cursor: pointer;
            font-size: 0.85rem; font-weight: 600; user-select: none;
            border: 2px solid ${color};
            background-color: ${color};
            color: #fff;
            transition: background-color 0.2s, color 0.2s;
        `;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = selectedMethods.has(key);
        checkbox.style.display = 'none';

        const applyStyle = (checked) => {
            label.style.backgroundColor = checked ? color : 'transparent';
            label.style.color           = checked ? '#fff' : color;
        };
        applyStyle(checkbox.checked);

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectedMethods.add(key);
            } else {
                if (selectedMethods.size === 1) { checkbox.checked = true; return; }
                selectedMethods.delete(key);
            }
            applyStyle(checkbox.checked);
            updateChart();
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(icon + ' ' + key));
        pillRow.appendChild(label);
    });

    panel.appendChild(wrapper);
}

function updateChart() {
    const jurisdiction = document.getElementById('demo-jurisdiction').value;
    const year         = +document.getElementById('demo-year').value;
    const container    = document.getElementById('demographics-chart');

    d3.select('#demographics-chart').selectAll('*').remove();

    const rawRows = getDemographicBreakdown(jurisdiction, year, showAggregate);

    // Apply detection method filter
    const activeMethods = [...selectedMethods];
    const filteredRows = rawRows.filter(d => activeMethods.includes(d.detectionMethod));

    if (filteredRows.length === 0) {
        d3.select('#demographics-chart')
            .append('p')
            .style('text-align', 'center').style('padding', '50px')
            .style('color', 'var(--text-secondary)')
            .text('No data available for this selection');
        return;
    }

    // Group by ageGroup, then split by method
    const grouped = d3.group(filteredRows, d => d.ageGroup);
    const barData = Array.from(grouped, ([ageGroup, values]) => {
        const policeRow = values.find(v => v.detectionMethod === 'Police');
        const cameraRow = values.find(v => v.detectionMethod === 'Camera');
        return {
            ageGroup,
            Police:        policeRow ? policeRow.fines   : 0,
            Camera:        cameraRow ? cameraRow.fines   : 0,
            PoliceCharges: policeRow ? policeRow.charges : 0,
            CameraCharges: cameraRow ? cameraRow.charges : 0,
            PoliceArrests: policeRow ? policeRow.arrests : 0,
            CameraArrests: cameraRow ? cameraRow.arrests : 0,
        };
    });

    barData.sort((a, b) => {
        const ai = FULL_AGE_ORDER.indexOf(a.ageGroup);
        const bi = FULL_AGE_ORDER.indexOf(b.ageGroup);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    const hasPolice = activeMethods.includes('Police') && barData.some(d => d.Police > 0);
    const hasCamera = activeMethods.includes('Camera') && barData.some(d => d.Camera > 0);
    const methods   = ['Police', 'Camera'].filter(m => m === 'Police' ? hasPolice : hasCamera);

    const hasAnyCharges = barData.some(d => d.PoliceCharges + d.CameraCharges > 0);
    const hasAnyArrests = barData.some(d => d.PoliceArrests + d.CameraArrests > 0);
    const showSecondary = hasAnyCharges || hasAnyArrests;

    const locationLabel = getDemographicLocationLabel(jurisdiction, year);

    // ── Shared layout ─────────────────────────────────────────────────────────
    const margin      = { top: 60, right: 20, bottom: 55, left: 80 };
    const containerW  = container.clientWidth || 900;
    const innerWidth  = containerW - margin.left - margin.right;

    const x0 = d3.scaleBand()
        .domain(barData.map(d => d.ageGroup))
        .range([0, innerWidth])
        .padding(0.22);

    const x1 = d3.scaleBand()
        .domain(methods)
        .range([0, x0.bandwidth()])
        .padding(0.06);

    // ═════════════════════════════════════════════════════════════════════════
    // CHART 1 — Fines
    // ═════════════════════════════════════════════════════════════════════════
    const finesHeight = Math.max(400, Math.min(500, containerW * 0.45));
    const finesInnerH = finesHeight - margin.top - margin.bottom;

    const yFinesMax = d3.max(barData, d => Math.max(d.Police, d.Camera)) || 1;
    const yFines = d3.scaleLinear()
        .domain([0, yFinesMax * 1.18]).nice()
        .range([finesInnerH, 0]);

    const svg1 = d3.select('#demographics-chart')
        .append('svg')
        .attr('width', containerW)
        .attr('height', finesHeight);

    const g1 = svg1.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    g1.append('text')
        .attr('x', innerWidth / 2).attr('y', -38)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px').style('fill', 'var(--text-secondary)')
        .text(jurisdiction + ' ' + year + '  \u00b7  ' + locationLabel);

    g1.append('text')
        .attr('x', innerWidth / 2).attr('y', -20)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px').style('font-weight', '700').style('fill', 'var(--text-primary)')
        .text('Fines by Age Group');

    g1.append('g').attr('class', 'grid').attr('opacity', 0.08)
        .call(d3.axisLeft(yFines).tickSize(-innerWidth).tickFormat(''));

    g1.append('g').attr('class', 'axis')
        .attr('transform', 'translate(0,' + finesInnerH + ')')
        .call(d3.axisBottom(x0))
        .selectAll('text').style('font-size', '12px');

    g1.append('text')
        .attr('x', innerWidth / 2).attr('y', finesInnerH + 48)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px').style('font-weight', '600').style('fill', 'currentColor')
        .text('Age Group');

    g1.append('g').attr('class', 'axis').call(d3.axisLeft(yFines).tickFormat(formatNumber));
    g1.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -finesInnerH / 2).attr('y', -65)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px').style('font-weight', '600').style('fill', 'currentColor')
        .text('Number of Fines');

    const ageGroups1 = g1.selectAll('.age-group')
        .data(barData).join('g').attr('class', 'age-group')
        .attr('transform', d => 'translate(' + x0(d.ageGroup) + ',0)');

    ageGroups1.selectAll('rect')
        .data(d => methods.map(method => ({ method, value: d[method], ageGroup: d.ageGroup, charges: d[method + 'Charges'], arrests: d[method + 'Arrests'] })))
        .join('rect')
        .attr('x', d => x1(d.method)).attr('y', d => yFines(d.value))
        .attr('width', x1.bandwidth()).attr('height', d => finesInnerH - yFines(d.value))
        .attr('fill', d => d.method === 'Police' ? config.colors.police : config.colors.camera)
        .attr('rx', 3)
        .on('mouseover', function (event, d) {
            d3.select(this).attr('opacity', 0.75);
            showTooltip(
                '<strong>' + d.ageGroup + ' \u2014 ' + d.method + '</strong><br>' +
                'Fines: ' + formatNumber(d.value) + '<br>' +
                'Charges: ' + formatNumber(d.charges) + '<br>' +
                'Arrests: ' + formatNumber(d.arrests),
                event
            );
        })
        .on('mouseout', function () { d3.select(this).attr('opacity', 1); hideTooltip(); });

    ageGroups1.selectAll('.bar-label')
        .data(d => methods.map(method => ({ method, value: d[method], ageGroup: d.ageGroup })))
        .join('text').attr('class', 'bar-label')
        .attr('x', d => x1(d.method) + x1.bandwidth() / 2)
        .attr('y', d => {
            if (d.value < MIN_VALUE_FOR_LABEL) return 0;
            const barPx = finesInnerH - yFines(d.value);
            return barPx >= INSIDE_LABEL_MIN_PX ? yFines(d.value) + barPx / 2 + 4 : yFines(d.value) - 5;
        })
        .attr('text-anchor', 'middle')
        .style('font-size', '12px').style('font-weight', '600').style('pointer-events', 'none')
        .style('fill', d => {
            if (d.value < MIN_VALUE_FOR_LABEL) return 'none';
            const barPx = finesInnerH - yFines(d.value);
            return barPx >= INSIDE_LABEL_MIN_PX ? 'white' : 'var(--text-secondary)';
        })
        .text(d => d.value >= MIN_VALUE_FOR_LABEL ? formatNumber(d.value) : '');

    // ═════════════════════════════════════════════════════════════════════════
    // CHART 2 — Charges & Arrests
    // ═════════════════════════════════════════════════════════════════════════
    if (showSecondary) {
        const metrics = [];
        if (hasAnyCharges) metrics.push({ key: 'Charges', polKey: 'PoliceCharges', camKey: 'CameraCharges', color: '#ffa502', label: 'Charges' });
        if (hasAnyArrests) metrics.push({ key: 'Arrests', polKey: 'PoliceArrests', camKey: 'CameraArrests', color: '#ff6b9d', label: 'Arrests' });

        const secKeys = [];
        metrics.forEach(m => {
            if (hasPolice) secKeys.push({ key: m.polKey, method: 'Police', metric: m.key, color: config.colors.police, label: 'Police ' + m.label });
            if (hasCamera) secKeys.push({ key: m.camKey, method: 'Camera', metric: m.key, color: config.colors.camera, label: 'Camera ' + m.label });
        });

        const x1sec = d3.scaleBand()
            .domain(secKeys.map(k => k.key))
            .range([0, x0.bandwidth()])
            .padding(0.06);

        const ySecMax = d3.max(barData, d => d3.max(secKeys, k => d[k.key])) || 1;
        const secHeight  = Math.max(220, Math.min(300, containerW * 0.27));
        const secMarginT = 50;
        const secInnerH  = secHeight - secMarginT - margin.bottom;

        const ySec = d3.scaleLinear()
            .domain([0, ySecMax * 1.25]).nice()
            .range([secInnerH, 0]);

        const svg2 = d3.select('#demographics-chart')
            .append('svg')
            .attr('width', containerW)
            .attr('height', secHeight);

        const g2 = svg2.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + secMarginT + ')');

        g2.append('text')
            .attr('x', innerWidth / 2).attr('y', -28)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px').style('font-weight', '700').style('fill', 'var(--text-primary)')
            .text('Charges & Arrests by Age Group');

        g2.append('g').attr('class', 'grid').attr('opacity', 0.08)
            .call(d3.axisLeft(ySec).tickSize(-innerWidth).tickFormat(''));

        g2.append('g').attr('class', 'axis')
            .attr('transform', 'translate(0,' + secInnerH + ')')
            .call(d3.axisBottom(x0))
            .selectAll('text').style('font-size', '12px');

        g2.append('text')
            .attr('x', innerWidth / 2).attr('y', secInnerH + 48)
            .attr('text-anchor', 'middle')
            .style('font-size', '13px').style('font-weight', '600').style('fill', 'currentColor')
            .text('Age Group');

        g2.append('g').attr('class', 'axis').call(d3.axisLeft(ySec).ticks(5).tickFormat(formatNumber));
        g2.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -secInnerH / 2).attr('y', -65)
            .attr('text-anchor', 'middle')
            .style('font-size', '13px').style('font-weight', '600').style('fill', 'currentColor')
            .text('Count');

        const ageGroups2 = g2.selectAll('.age-group-sec')
            .data(barData).join('g').attr('class', 'age-group-sec')
            .attr('transform', d => 'translate(' + x0(d.ageGroup) + ',0)');

        ageGroups2.selectAll('rect')
            .data(d => secKeys.map(k => ({ key: k.key, value: d[k.key], label: k.label, color: k.color, ageGroup: d.ageGroup, method: k.method, metric: k.metric })))
            .join('rect')
            .attr('x', d => x1sec(d.key)).attr('y', d => ySec(d.value))
            .attr('width', x1sec.bandwidth()).attr('height', d => secInnerH - ySec(d.value))
            .attr('fill', d => d.color).attr('rx', 2).attr('opacity', 0.85)
            .on('mouseover', function (event, d) {
                d3.select(this).attr('opacity', 1);
                showTooltip(
                    '<strong>' + d.ageGroup + ' \u2014 ' + d.label + '</strong><br>' +
                    'Count: ' + formatNumber(d.value),
                    event
                );
            })
            .on('mouseout', function () { d3.select(this).attr('opacity', 0.85); hideTooltip(); });

        ageGroups2.selectAll('.sec-label')
            .data(d => secKeys.map(k => ({ key: k.key, value: d[k.key], label: k.label, ageGroup: d.ageGroup })))
            .join('text').attr('class', 'sec-label')
            .attr('x', d => x1sec(d.key) + x1sec.bandwidth() / 2)
            .attr('y', d => {
                if (d.value < 1) return 0;
                const barPx = secInnerH - ySec(d.value);
                return barPx >= INSIDE_LABEL_MIN_PX ? ySec(d.value) + barPx / 2 + 4 : ySec(d.value) - 4;
            })
            .attr('text-anchor', 'middle')
            .style('font-size', '10px').style('font-weight', '600').style('pointer-events', 'none')
            .style('fill', d => {
                if (d.value < 1) return 'none';
                return (secInnerH - ySec(d.value)) >= INSIDE_LABEL_MIN_PX ? 'white' : 'var(--text-secondary)';
            })
            .text(d => d.value >= 1 ? formatNumber(d.value) : '');
    }

    // ── Legend ─────────────────────────────────────────────────────────────
    const legendDiv = d3.select('#demographics-chart')
        .append('div')
        .style('display', 'flex').style('flex-wrap', 'wrap').style('gap', '20px')
        .style('justify-content', 'center').style('padding', '12px 0 4px 0').style('margin-top', '8px');

    const legendItems = methods.map(m => ({ label: m, color: m === 'Police' ? config.colors.police : config.colors.camera }));
    if (showSecondary) {
        if (hasAnyCharges) legendItems.push({ label: 'Charges', color: '#ffa502' });
        if (hasAnyArrests) legendItems.push({ label: 'Arrests', color: '#ff6b9d' });
    }

    legendItems.forEach(function(item) {
        const el = legendDiv.append('div')
            .style('display', 'flex').style('align-items', 'center').style('gap', '8px');
        el.append('div')
            .style('width', '18px').style('height', '18px').style('border-radius', '3px')
            .style('background-color', item.color).style('flex-shrink', '0');
        el.append('span')
            .style('font-size', '13px').style('color', 'var(--text-primary)').text(item.label);
    });

    if (!hasCamera) {
        legendDiv.append('span')
            .style('font-size', '12px').style('color', 'var(--text-secondary)').style('font-style', 'italic')
            .text('\u2139\ufe0f No camera detection data recorded for this jurisdiction / year');
    }

    if (!showSecondary) {
        legendDiv.append('span')
            .style('font-size', '12px').style('color', 'var(--text-secondary)').style('font-style', 'italic')
            .text('\u2139\ufe0f No charges or arrests recorded for this jurisdiction / year');
    }
}