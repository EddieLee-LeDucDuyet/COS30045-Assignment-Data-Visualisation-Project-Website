// ===========================
// Demographics Chart
// Grouped bar chart for age groups — Police vs Camera per age group
// ===========================

import { config, ageGroupOrder } from '../modules/config.js';
import { getDemographicBreakdown, getDemographicLocationLabel } from '../utils/dataLoader.js';
import { formatNumber, getChartDimensions } from '../utils/helpers.js';
import { showTooltip, hideTooltip } from '../utils/tooltip.js';

// Full ordered list including '0-65+' as the last bar
const FULL_AGE_ORDER = (() => {
    const order = [...ageGroupOrder];
    if (!order.includes('0-65+')) order.push('0-65+');
    return order;
})();

// A bar must be at least this many pixels tall to hold an INSIDE label
const INSIDE_LABEL_MIN_PX = 20;

// A bar must have at least this value to get ANY label (skip true zeros)
const MIN_VALUE_FOR_LABEL = 1;

export function createDemographicsChart() {
    const jurisdictionSelect = document.getElementById('demo-jurisdiction');
    const yearSelect         = document.getElementById('demo-year');

    jurisdictionSelect.addEventListener('change', updateChart);
    yearSelect.addEventListener('change', updateChart);

    updateChart();
}

function updateChart() {
    const jurisdiction = document.getElementById('demo-jurisdiction').value;
    const year         = +document.getElementById('demo-year').value;
    const container    = document.getElementById('demographics-chart');

    d3.select('#demographics-chart').selectAll('*').remove();

    // ── Fetch & shape data ────────────────────────────────────────────────────
    const rawRows = getDemographicBreakdown(jurisdiction, year);

    if (rawRows.length === 0) {
        d3.select('#demographics-chart')
            .append('p')
            .style('text-align', 'center')
            .style('padding', '50px')
            .style('color', 'var(--text-secondary)')
            .text('No data available for this selection');
        return;
    }

    const grouped = d3.group(rawRows, d => d.ageGroup);
    const barData = Array.from(grouped, ([ageGroup, values]) => {
        const policeRow = values.find(v => v.detectionMethod === 'Police');
        const cameraRow = values.find(v => v.detectionMethod === 'Camera');
        return {
            ageGroup,
            Police: policeRow ? policeRow.fines : 0,
            Camera: cameraRow ? cameraRow.fines : 0
        };
    });

    barData.sort((a, b) => {
        const ai = FULL_AGE_ORDER.indexOf(a.ageGroup);
        const bi = FULL_AGE_ORDER.indexOf(b.ageGroup);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    const hasPolice = barData.some(d => d.Police > 0);
    const hasCamera = barData.some(d => d.Camera > 0);
    const methods   = ['Police', 'Camera'].filter(m =>
        m === 'Police' ? hasPolice : hasCamera
    );

    // ── Layout ────────────────────────────────────────────────────────────────
    // Extra top margin so above-bar labels for the tallest bars don't clip
    const margin = { ...config.margin, top: 60 };
    const dims   = getChartDimensions(container, margin);

    const svg = d3.select('#demographics-chart')
        .append('svg')
        .attr('width',  dims.width)
        .attr('height', dims.height);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Subtitle
    const locationLabel = getDemographicLocationLabel(jurisdiction, year);
    g.append('text')
        .attr('x', dims.innerWidth / 2)
        .attr('y', -38)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', 'var(--text-secondary)')
        .text(`${jurisdiction} ${year}  ·  ${locationLabel}`);

    // ── Scales ────────────────────────────────────────────────────────────────
    const x0 = d3.scaleBand()
        .domain(barData.map(d => d.ageGroup))
        .range([0, dims.innerWidth])
        .padding(0.22);

    const x1 = d3.scaleBand()
        .domain(methods)
        .range([0, x0.bandwidth()])
        .padding(0.06);

    const yMax = d3.max(barData, d => Math.max(d.Police, d.Camera)) || 1;

    // Reserve headroom at the top for above-bar labels (≈ one label height + gap)
    const yScale = d3.scaleLinear()
        .domain([0, yMax * 1.18])
        .nice()
        .range([dims.innerHeight, 0]);

    // ── Grid ──────────────────────────────────────────────────────────────────
    g.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.08)
        .call(d3.axisLeft(yScale).tickSize(-dims.innerWidth).tickFormat(''));

    // ── Axes ──────────────────────────────────────────────────────────────────
    g.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${dims.innerHeight})`)
        .call(d3.axisBottom(x0))
        .selectAll('text')
        .style('font-size', '12px');

    g.append('text')
        .attr('x', dims.innerWidth / 2)
        .attr('y', dims.innerHeight + 50)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px')
        .style('font-weight', '600')
        .style('fill', 'currentColor')
        .text('Age Group');

    g.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(yScale).tickFormat(formatNumber));

    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -dims.innerHeight / 2)
        .attr('y', -65)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px')
        .style('font-weight', '600')
        .style('fill', 'currentColor')
        .text('Number of Fines');

    // ── Bar groups ────────────────────────────────────────────────────────────
    const ageGroups = g.selectAll('.age-group')
        .data(barData)
        .join('g')
        .attr('class', 'age-group')
        .attr('transform', d => `translate(${x0(d.ageGroup)},0)`);

    // Bars
    ageGroups.selectAll('rect')
        .data(d => methods.map(method => ({
            method,
            value: d[method],
            ageGroup: d.ageGroup
        })))
        .join('rect')
        .attr('x',      d => x1(d.method))
        .attr('y',      d => yScale(d.value))
        .attr('width',  x1.bandwidth())
        .attr('height', d => dims.innerHeight - yScale(d.value))
        .attr('fill',   d => d.method === 'Police' ? config.colors.police : config.colors.camera)
        .attr('rx', 3)
        .on('mouseover', function (event, d) {
            d3.select(this).attr('opacity', 0.75);
            showTooltip(
                `<strong>${d.ageGroup} — ${d.method}</strong><br>Fines: ${formatNumber(d.value)}`,
                event
            );
        })
        .on('mouseout', function () {
            d3.select(this).attr('opacity', 1);
            hideTooltip();
        });

    // ── Value labels — always shown for every non-zero bar ───────────────────
    //
    // Placement logic:
    //   • barPx >= INSIDE_LABEL_MIN_PX  → label sits INSIDE the bar (white text)
    //   • barPx <  INSIDE_LABEL_MIN_PX  → label sits ABOVE  the bar (muted text)
    //   • value === 0                   → no label
    //
    ageGroups.selectAll('.bar-label')
        .data(d => methods.map(method => ({
            method,
            value:    d[method],
            ageGroup: d.ageGroup
        })))
        .join('text')
        .attr('class', 'bar-label')
        .attr('x', d => x1(d.method) + x1.bandwidth() / 2)
        .attr('y', d => {
            if (d.value < MIN_VALUE_FOR_LABEL) return 0; // won't be shown
            const barPx = dims.innerHeight - yScale(d.value);
            if (barPx >= INSIDE_LABEL_MIN_PX) {
                // Inside: vertically centred in bar
                return yScale(d.value) + barPx / 2 + 4;
            } else {
                // Above: a fixed gap above the bar top
                return yScale(d.value) - 5;
            }
        })
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('pointer-events', 'none')
        .style('fill', d => {
            if (d.value < MIN_VALUE_FOR_LABEL) return 'none';
            const barPx = dims.innerHeight - yScale(d.value);
            return barPx >= INSIDE_LABEL_MIN_PX ? 'white' : 'var(--text-secondary)';
        })
        .text(d => d.value >= MIN_VALUE_FOR_LABEL ? formatNumber(d.value) : '');

    // ── Legend ────────────────────────────────────────────────────────────────
    const legendDiv = d3.select('#demographics-chart')
        .append('div')
        .style('display',         'flex')
        .style('flex-wrap',       'wrap')
        .style('gap',             '20px')
        .style('justify-content', 'center')
        .style('padding',         '12px 0 4px 0')
        .style('margin-top',      '8px');

    methods.forEach(method => {
        const item = legendDiv.append('div')
            .style('display',     'flex')
            .style('align-items', 'center')
            .style('gap',         '8px');

        item.append('div')
            .style('width',            '18px')
            .style('height',           '18px')
            .style('border-radius',    '3px')
            .style('background-color',
                method === 'Police' ? config.colors.police : config.colors.camera)
            .style('flex-shrink', '0');

        item.append('span')
            .style('font-size', '13px')
            .style('color',     'var(--text-primary)')
            .text(method);
    });

    if (!hasCamera) {
        legendDiv.append('span')
            .style('font-size',  '12px')
            .style('color',      'var(--text-secondary)')
            .style('font-style', 'italic')
            .text('ℹ️ No camera detection data recorded for this jurisdiction / year');
    }
}