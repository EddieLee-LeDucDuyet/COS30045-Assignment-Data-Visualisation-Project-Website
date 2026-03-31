// ===========================
// Enforcement Method Chart
// Diverging stacked bar chart — Police (left) vs Camera (right)
// Each row = one year; bars grow from a shared centre axis.
// ===========================

import { config } from '../modules/config.js';
import { filterData, aggregateData } from '../utils/dataLoader.js';
import { formatNumber, getChartDimensions } from '../utils/helpers.js';
import { showTooltip, hideTooltip } from '../utils/tooltip.js';

/**
 * Create the enforcement method diverging chart.
 * @param {string} containerId
 * @param {string} sliderId
 */
export function createEnforcementChart(containerId = 'enforcement-chart', sliderId = 'year-slider') {
    const slider  = document.getElementById(sliderId);
    const display = document.getElementById('year-display');

    slider.addEventListener('input', function () {
        display.textContent = this.value;
        renderDivergingChart(containerId, +this.value);
    });

    renderDivergingChart(containerId, +slider.value);
}

/**
 * Build / rebuild the diverging stacked bar chart.
 * @param {string} containerId
 * @param {number} maxYear  – show all years from 2008 up to this value
 */
function renderDivergingChart(containerId, maxYear) {
    const container = document.getElementById(containerId);
    d3.select(`#${containerId}`).selectAll('*').remove();

    // ── Data preparation ──────────────────────────────────────────────────────
    const filtered = filterData({
        yearRange: [2008, maxYear],
        location: 'General',
        ageGroup: '0-65+'
    });

    const aggregated = aggregateData(filtered, ['year', 'detectionMethod']);

    const years = d3.range(2008, maxYear + 1);
    const rowData = years.map(year => {
        const policeRow = aggregated.find(d => d.year === year && d.detectionMethod === 'Police');
        const cameraRow = aggregated.find(d => d.year === year && d.detectionMethod === 'Camera');
        const police = policeRow ? policeRow.fines : 0;
        const camera = cameraRow ? cameraRow.fines : 0;
        const total  = police + camera;
        return {
            year,
            police,
            camera,
            total,
            policePct: total > 0 ? police / total : 0,
            cameraPct: total > 0 ? camera / total : 0
        };
    });

    // ── Dimensions ───────────────────────────────────────────────────────────
    // Give each year a fixed row height; total height grows with slider
    const ROW_H      = 36;
    const ROW_PAD    = 6;
    const marginTop  = 60;
    const marginBot  = 70;
    const marginL    = 52;   // left label area (year)
    const marginR    = 52;   // right label area (year mirrored)
    const innerLabelW = 90;  // reserved for the centre labels

    const totalWidth  = container.clientWidth || 800;
    const chartWidth  = totalWidth - marginL - marginR - innerLabelW;
    const halfW       = chartWidth / 2;           // each side gets half
    const totalHeight = marginTop + years.length * (ROW_H + ROW_PAD) + marginBot;

    // ── SVG ──────────────────────────────────────────────────────────────────
    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', totalWidth)
        .attr('height', totalHeight);

    // Main group shifted so the centre axis is at halfW + marginL + innerLabelW/2
    const centreX = marginL + halfW + innerLabelW / 2;

    const g = svg.append('g')
        .attr('transform', `translate(${centreX},${marginTop})`);

    // ── Scale (percentage 0-1 → pixels, each side) ────────────────────────
    const pctScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, halfW]);

    // ── Background stripes ───────────────────────────────────────────────────
    g.selectAll('.stripe')
        .data(rowData)
        .join('rect')
        .attr('class', 'stripe')
        .attr('x', -halfW - innerLabelW / 2)
        .attr('y', (d, i) => i * (ROW_H + ROW_PAD) - ROW_PAD / 2)
        .attr('width', chartWidth + innerLabelW)
        .attr('height', ROW_H + ROW_PAD)
        .attr('fill', (d, i) => i % 2 === 0
            ? 'rgba(255,255,255,0.02)'
            : 'rgba(255,255,255,0.045)')
        .attr('rx', 3);

    // ── Camera bars (right side, positive direction) ──────────────────────
    g.selectAll('.bar-camera')
        .data(rowData)
        .join('rect')
        .attr('class', 'bar-camera')
        .attr('x', 0)
        .attr('y', (d, i) => i * (ROW_H + ROW_PAD) + 2)
        .attr('width', d => pctScale(d.cameraPct))
        .attr('height', ROW_H - 4)
        .attr('fill', config.colors.camera)
        .attr('rx', 2)
        .attr('opacity', 0.88)
        .on('mouseover', function (event, d) {
            d3.select(this).attr('opacity', 1);
            showTooltip(`
                <strong>${d.year} — Camera</strong><br>
                Fines: ${formatNumber(d.camera)}<br>
                Share: ${(d.cameraPct * 100).toFixed(1)}%
            `, event);
        })
        .on('mouseout', function () {
            d3.select(this).attr('opacity', 0.88);
            hideTooltip();
        });

    // ── Police bars (left side, negative direction) ───────────────────────
    g.selectAll('.bar-police')
        .data(rowData)
        .join('rect')
        .attr('class', 'bar-police')
        .attr('x', d => -pctScale(d.policePct))
        .attr('y', (d, i) => i * (ROW_H + ROW_PAD) + 2)
        .attr('width', d => pctScale(d.policePct))
        .attr('height', ROW_H - 4)
        .attr('fill', config.colors.police)
        .attr('rx', 2)
        .attr('opacity', 0.88)
        .on('mouseover', function (event, d) {
            d3.select(this).attr('opacity', 1);
            showTooltip(`
                <strong>${d.year} — Police</strong><br>
                Fines: ${formatNumber(d.police)}<br>
                Share: ${(d.policePct * 100).toFixed(1)}%
            `, event);
        })
        .on('mouseout', function () {
            d3.select(this).attr('opacity', 0.88);
            hideTooltip();
        });

    // ── Centre axis line ─────────────────────────────────────────────────────
    g.append('line')
        .attr('x1', 0).attr('x2', 0)
        .attr('y1', -8)
        .attr('y2', years.length * (ROW_H + ROW_PAD) + 4)
        .attr('stroke', 'var(--border-color)')
        .attr('stroke-width', 1.5);

    // ── Year labels (centre column) ──────────────────────────────────────────
    g.selectAll('.year-label')
        .data(rowData)
        .join('text')
        .attr('class', 'year-label')
        .attr('x', 0)
        .attr('y', (d, i) => i * (ROW_H + ROW_PAD) + ROW_H / 2 + 1)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '11px')
        .style('font-weight', '700')
        .style('fill', d => d.year === 2020 ? '#ff6b9d' : 'var(--text-secondary)')
        .text(d => d.year);

    // ── Percentage labels inside bars (only if bar is wide enough) ──────────
    const MIN_LABEL_PCT = 0.08;   // at least 8% share to show label

    g.selectAll('.label-camera')
        .data(rowData.filter(d => d.cameraPct >= MIN_LABEL_PCT))
        .join('text')
        .attr('class', 'label-camera')
        .attr('x', d => pctScale(d.cameraPct) - 5)
        .attr('y', (d) => rowData.indexOf(d) * (ROW_H + ROW_PAD) + ROW_H / 2 + 1)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '10px')
        .style('font-weight', '600')
        .style('fill', 'white')
        .style('pointer-events', 'none')
        .text(d => `${(d.cameraPct * 100).toFixed(0)}%`);

    g.selectAll('.label-police')
        .data(rowData.filter(d => d.policePct >= MIN_LABEL_PCT))
        .join('text')
        .attr('class', 'label-police')
        .attr('x', d => -pctScale(d.policePct) + 5)
        .attr('y', (d) => rowData.indexOf(d) * (ROW_H + ROW_PAD) + ROW_H / 2 + 1)
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '10px')
        .style('font-weight', '600')
        .style('fill', 'white')
        .style('pointer-events', 'none')
        .text(d => `${(d.policePct * 100).toFixed(0)}%`);

    // ── Camera introduction annotation (2020) ────────────────────────────────
    const introIdx = rowData.findIndex(d => d.year === 2020);
    if (introIdx >= 0) {
        const annoY = introIdx * (ROW_H + ROW_PAD) - 10;
        g.append('line')
            .attr('x1', -halfW - innerLabelW / 2 + 8)
            .attr('x2', halfW + innerLabelW / 2 - 8)
            .attr('y1', annoY)
            .attr('y2', annoY)
            .attr('stroke', '#ff6b9d')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,3')
            .attr('opacity', 0.7);

        g.append('text')
            .attr('x', halfW + innerLabelW / 2 - 10)
            .attr('y', annoY - 4)
            .attr('text-anchor', 'end')
            .style('font-size', '10px')
            .style('font-weight', '600')
            .style('fill', '#ff6b9d')
            .text('▲ Camera detection introduced');
    }

    // ── Top axis ticks (percentage scale) ────────────────────────────────────
    const topY = -28;
    const tickPcts = [0, 0.25, 0.5, 0.75, 1];

    // Police side (left)
    tickPcts.forEach(p => {
        const x = -pctScale(p);
        g.append('line')
            .attr('x1', x).attr('x2', x)
            .attr('y1', topY).attr('y2', topY + 6)
            .attr('stroke', 'var(--border-color)')
            .attr('stroke-width', 1);
        if (p > 0) {
            g.append('text')
                .attr('x', x)
                .attr('y', topY - 4)
                .attr('text-anchor', 'middle')
                .style('font-size', '10px')
                .style('fill', 'var(--text-secondary)')
                .text(`${p * 100}%`);
        }
    });

    // Camera side (right)
    tickPcts.filter(p => p > 0).forEach(p => {
        const x = pctScale(p);
        g.append('line')
            .attr('x1', x).attr('x2', x)
            .attr('y1', topY).attr('y2', topY + 6)
            .attr('stroke', 'var(--border-color)')
            .attr('stroke-width', 1);
        g.append('text')
            .attr('x', x)
            .attr('y', topY - 4)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', 'var(--text-secondary)')
            .text(`${p * 100}%`);
    });

    // ── Side header labels ────────────────────────────────────────────────────
    const lastRowY = years.length * (ROW_H + ROW_PAD) + 14;

    // Police header (left)
    g.append('text')
        .attr('x', -halfW / 2)
        .attr('y', topY - 18)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px')
        .style('font-weight', '700')
        .style('fill', config.colors.police)
        .text('← Police');

    // Camera header (right)
    g.append('text')
        .attr('x', halfW / 2)
        .attr('y', topY - 18)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px')
        .style('font-weight', '700')
        .style('fill', config.colors.camera)
        .text('Camera →');

    // ── Bottom: total fines axis ──────────────────────────────────────────────
    // Show absolute totals as a secondary reference below the chart
    const maxTotal = d3.max(rowData, d => d.total) || 1;
    const absScale = d3.scaleLinear().domain([0, maxTotal]).range([0, halfW]);

    const absY = lastRowY + 16;

    g.append('text')
        .attr('x', 0)
        .attr('y', absY - 4)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', 'var(--text-secondary)')
        .text('Total fines (all methods combined)');

    // Total bar (right of centre, neutral colour)
    g.selectAll('.bar-total')
        .data(rowData)
        .join('rect')
        .attr('class', 'bar-total')
        .style('display', 'none'); // hidden; kept for potential tooltip use

    // Simple text totals to the right of camera bars
    g.selectAll('.total-label')
        .data(rowData)
        .join('text')
        .attr('class', 'total-label')
        .attr('x', halfW + innerLabelW / 2 - 4)
        .attr('y', (d, i) => i * (ROW_H + ROW_PAD) + ROW_H / 2 + 1)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '10px')
        .style('fill', 'var(--text-secondary)')
        .text(d => d.total > 0 ? formatNumber(d.total) : '');

    // "Total" column header
    g.append('text')
        .attr('x', halfW + innerLabelW / 2 - 4)
        .attr('y', topY - 18)
        .attr('text-anchor', 'end')
        .style('font-size', '10px')
        .style('font-weight', '600')
        .style('fill', 'var(--text-secondary)')
        .text('Total');

    // ── HTML legend below SVG ────────────────────────────────────────────────
    const legendDiv = d3.select(`#${containerId}`)
        .append('div')
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('gap', '24px')
        .style('justify-content', 'center')
        .style('padding', '12px 0 4px 0')
        .style('margin-top', '4px');

    [
        { label: 'Police (manual detection)',   color: config.colors.police },
        { label: 'Camera (automated detection)', color: config.colors.camera }
    ].forEach(({ label, color }) => {
        const item = legendDiv.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '8px');

        item.append('div')
            .style('width', '18px')
            .style('height', '18px')
            .style('border-radius', '3px')
            .style('background-color', color)
            .style('opacity', '0.88')
            .style('flex-shrink', '0');

        item.append('span')
            .style('font-size', '13px')
            .style('color', 'var(--text-primary)')
            .text(label);
    });
}

export { renderDivergingChart as updateEnforcementChart };