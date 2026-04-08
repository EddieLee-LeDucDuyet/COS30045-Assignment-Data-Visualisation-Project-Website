// ===========================
// Enforcement Method Chart
// Diverging stacked bar chart — Police (left) vs Camera (right)
// Each row = one year; bars grow from a shared centre axis.
// Right side shows Total fines | Charges | Arrests columns.
// Only shows years from 2020 onwards (camera era).
// ===========================

import { config } from '../modules/config.js';
import { getYearlyTrendsByMethod } from '../utils/dataLoader.js';
import { formatNumber, getChartDimensions } from '../utils/helpers.js';
import { showTooltip, hideTooltip } from '../utils/tooltip.js';

const CAMERA_START_YEAR = 2020;

export function createEnforcementChart(containerId = 'enforcement-chart') {
    renderDivergingChart(containerId);
}

function renderDivergingChart(containerId) {
    const container = document.getElementById(containerId);
    d3.select('#' + containerId).selectAll('*').remove();

    // Data — only camera era
    const aggregated = getYearlyTrendsByMethod([CAMERA_START_YEAR, 2024]);

    const years = d3.range(CAMERA_START_YEAR, 2025);
    const rowData = years.map(year => {
        const policeRow = aggregated.find(d => d.year === year && d.detectionMethod === 'Police');
        const cameraRow = aggregated.find(d => d.year === year && d.detectionMethod === 'Camera');
        const police        = policeRow ? policeRow.fines   : 0;
        const camera        = cameraRow ? cameraRow.fines   : 0;
        const policeCharges = policeRow ? policeRow.charges : 0;
        const cameraCharges = cameraRow ? cameraRow.charges : 0;
        const policeArrests = policeRow ? policeRow.arrests : 0;
        const cameraArrests = cameraRow ? cameraRow.arrests : 0;
        const total         = police + camera;
        return {
            year,
            police, camera, total,
            policeCharges, cameraCharges, totalCharges: policeCharges + cameraCharges,
            policeArrests, cameraArrests, totalArrests: policeArrests + cameraArrests,
            policePct: total > 0 ? police / total : 0,
            cameraPct: total > 0 ? camera / total : 0,
        };
    });

    // Layout
    const ROW_H      = 42;
    const ROW_PAD    = 8;
    const marginTop  = 72;
    const marginBot  = 40;
    const marginL    = 52;
    const innerLabelW = 56;
    const COL_W      = 64;
    const NUM_COLS   = 3;
    const rightCols  = COL_W * NUM_COLS;

    const totalWidth  = container.clientWidth || 800;
    const chartWidth  = totalWidth - marginL - innerLabelW - rightCols;
    const halfW       = chartWidth / 2;
    const totalHeight = marginTop + years.length * (ROW_H + ROW_PAD) + marginBot;

    const svg = d3.select('#' + containerId)
        .append('svg')
        .attr('width', totalWidth)
        .attr('height', totalHeight);

    const centreX = marginL + halfW + innerLabelW / 2;
    const g = svg.append('g')
        .attr('transform', 'translate(' + centreX + ',' + marginTop + ')');

    const pctScale = d3.scaleLinear().domain([0, 1]).range([0, halfW]);

    // Background stripes
    const stripeW = chartWidth + innerLabelW + rightCols;
    g.selectAll('.stripe')
        .data(rowData).join('rect').attr('class', 'stripe')
        .attr('x', -halfW - innerLabelW / 2)
        .attr('y', (d, i) => i * (ROW_H + ROW_PAD) - ROW_PAD / 2)
        .attr('width', stripeW).attr('height', ROW_H + ROW_PAD)
        .attr('fill', (d, i) => i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.045)')
        .attr('rx', 3);

    // Camera bars
    g.selectAll('.bar-camera')
        .data(rowData).join('rect').attr('class', 'bar-camera')
        .attr('x', 0)
        .attr('y', (d, i) => i * (ROW_H + ROW_PAD) + 2)
        .attr('width', d => pctScale(d.cameraPct))
        .attr('height', ROW_H - 4)
        .attr('fill', config.colors.camera).attr('rx', 2).attr('opacity', 0.88)
        .on('mouseover', function (event, d) {
            d3.select(this).attr('opacity', 1);
            showTooltip(
                '<strong>' + d.year + ' \u2014 Camera</strong><br>' +
                'Fines: ' + formatNumber(d.camera) + '<br>' +
                'Share: ' + (d.cameraPct * 100).toFixed(1) + '%<br>' +
                'Charges: ' + formatNumber(d.cameraCharges) + '<br>' +
                'Arrests: ' + formatNumber(d.cameraArrests),
                event
            );
        })
        .on('mouseout', function () { d3.select(this).attr('opacity', 0.88); hideTooltip(); });

    // Police bars
    g.selectAll('.bar-police')
        .data(rowData).join('rect').attr('class', 'bar-police')
        .attr('x', d => -pctScale(d.policePct))
        .attr('y', (d, i) => i * (ROW_H + ROW_PAD) + 2)
        .attr('width', d => pctScale(d.policePct))
        .attr('height', ROW_H - 4)
        .attr('fill', config.colors.police).attr('rx', 2).attr('opacity', 0.88)
        .on('mouseover', function (event, d) {
            d3.select(this).attr('opacity', 1);
            showTooltip(
                '<strong>' + d.year + ' \u2014 Police</strong><br>' +
                'Fines: ' + formatNumber(d.police) + '<br>' +
                'Share: ' + (d.policePct * 100).toFixed(1) + '%<br>' +
                'Charges: ' + formatNumber(d.policeCharges) + '<br>' +
                'Arrests: ' + formatNumber(d.policeArrests),
                event
            );
        })
        .on('mouseout', function () { d3.select(this).attr('opacity', 0.88); hideTooltip(); });

    // Centre axis
    g.append('line')
        .attr('x1', 0).attr('x2', 0)
        .attr('y1', -8).attr('y2', years.length * (ROW_H + ROW_PAD) + 4)
        .attr('stroke', 'var(--border-color)').attr('stroke-width', 1.5);

    // Year labels
    g.selectAll('.year-label')
        .data(rowData).join('text').attr('class', 'year-label')
        .attr('x', 0).attr('y', (d, i) => i * (ROW_H + ROW_PAD) + ROW_H / 2 + 1)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .style('font-size', '11px').style('font-weight', '700')
        .style('fill', 'var(--text-secondary)')
        .text(d => d.year);

    // % labels inside bars
    const MIN_LABEL_PCT = 0.08;

    g.selectAll('.label-camera')
        .data(rowData.filter(d => d.cameraPct >= MIN_LABEL_PCT)).join('text')
        .attr('class', 'label-camera')
        .attr('x', d => pctScale(d.cameraPct) - 5)
        .attr('y', d => rowData.indexOf(d) * (ROW_H + ROW_PAD) + ROW_H / 2 + 1)
        .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
        .style('font-size', '10px').style('font-weight', '600')
        .style('fill', 'white').style('pointer-events', 'none')
        .text(d => (d.cameraPct * 100).toFixed(0) + '%');

    g.selectAll('.label-police')
        .data(rowData.filter(d => d.policePct >= MIN_LABEL_PCT)).join('text')
        .attr('class', 'label-police')
        .attr('x', d => -pctScale(d.policePct) + 5)
        .attr('y', d => rowData.indexOf(d) * (ROW_H + ROW_PAD) + ROW_H / 2 + 1)
        .attr('text-anchor', 'start').attr('dominant-baseline', 'middle')
        .style('font-size', '10px').style('font-weight', '600')
        .style('fill', 'white').style('pointer-events', 'none')
        .text(d => (d.policePct * 100).toFixed(0) + '%');

    // Top axis ticks
    const topY = -40;
    const tickPcts = [0, 0.25, 0.5, 0.75, 1];

    tickPcts.forEach(p => {
        const x = -pctScale(p);
        g.append('line').attr('x1', x).attr('x2', x).attr('y1', topY).attr('y2', topY + 6)
            .attr('stroke', 'var(--border-color)').attr('stroke-width', 1);
        if (p > 0) {
            g.append('text').attr('x', x).attr('y', topY - 4).attr('text-anchor', 'middle')
                .style('font-size', '10px').style('fill', 'var(--text-secondary)')
                .text(p * 100 + '%');
        }
    });
    tickPcts.filter(p => p > 0).forEach(p => {
        const x = pctScale(p);
        g.append('line').attr('x1', x).attr('x2', x).attr('y1', topY).attr('y2', topY + 6)
            .attr('stroke', 'var(--border-color)').attr('stroke-width', 1);
        g.append('text').attr('x', x).attr('y', topY - 4).attr('text-anchor', 'middle')
            .style('font-size', '10px').style('fill', 'var(--text-secondary)')
            .text(p * 100 + '%');
    });

    // Side headers
    g.append('text').attr('x', -halfW / 2).attr('y', topY - 18).attr('text-anchor', 'middle')
        .style('font-size', '13px').style('font-weight', '700').style('fill', config.colors.police)
        .text('\u2190 Police');

    g.append('text').attr('x', halfW / 2).attr('y', topY - 18).attr('text-anchor', 'middle')
        .style('font-size', '13px').style('font-weight', '700').style('fill', config.colors.camera)
        .text('Camera \u2192');

    // Right-side stat columns
    const colsStartX = halfW + innerLabelW / 2 + 8;

    const columns = [
        { key: 'total',        polKey: 'police',        camKey: 'camera',        label: ['Total', 'Fines'],   color: 'var(--text-secondary)' },
        { key: 'totalCharges', polKey: 'policeCharges', camKey: 'cameraCharges', label: ['Total', 'Charges'], color: '#ffa502' },
        { key: 'totalArrests', polKey: 'policeArrests', camKey: 'cameraArrests', label: ['Total', 'Arrests'], color: '#ff6b9d' },
    ];

    // Vertical divider before columns
    g.append('line')
        .attr('x1', colsStartX - 6).attr('x2', colsStartX - 6)
        .attr('y1', topY).attr('y2', years.length * (ROW_H + ROW_PAD))
        .attr('stroke', 'var(--border-color)').attr('stroke-opacity', 0.4).attr('stroke-width', 1);

    columns.forEach((col, ci) => {
        const cx = colsStartX + ci * COL_W + COL_W / 2;

        // Column header (2 lines)
        col.label.forEach((line, li) => {
            g.append('text')
                .attr('x', cx).attr('y', topY - 18 + li * 14)
                .attr('text-anchor', 'middle')
                .style('font-size', '10px').style('font-weight', '700').style('fill', col.color)
                .text(line);
        });

        // Divider between columns
        if (ci > 0) {
            g.append('line')
                .attr('x1', cx - COL_W / 2).attr('x2', cx - COL_W / 2)
                .attr('y1', topY).attr('y2', years.length * (ROW_H + ROW_PAD))
                .attr('stroke', 'var(--border-color)').attr('stroke-opacity', 0.2).attr('stroke-width', 1);
        }

        // Values
        g.selectAll('.col-' + col.key)
            .data(rowData).join('text')
            .attr('class', 'col-' + col.key)
            .attr('x', cx)
            .attr('y', (d, i) => i * (ROW_H + ROW_PAD) + ROW_H / 2 + 1)
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
            .style('font-size', '10px')
            .style('font-weight', d => d[col.key] > 0 ? '600' : '400')
            .style('fill', d => d[col.key] > 0 ? col.color : 'var(--border-color)')
            .text(d => d[col.key] > 0 ? formatNumber(d[col.key]) : '\u2014')
            .on('mouseover', function (event, d) {
                if (d[col.key] === 0) return;
                showTooltip(
                    '<strong>' + d.year + ' \u2014 ' + col.label.join(' ') + '</strong><br>' +
                    'Police: ' + formatNumber(d[col.polKey]) + '<br>' +
                    'Camera: ' + formatNumber(d[col.camKey]) + '<br>' +
                    '<strong>Total: ' + formatNumber(d[col.key]) + '</strong>',
                    event
                );
            })
            .on('mouseout', hideTooltip);
    });

    // Legend
    const legendDiv = d3.select('#' + containerId)
        .append('div')
        .style('display', 'flex').style('flex-wrap', 'wrap').style('gap', '20px')
        .style('justify-content', 'center').style('padding', '14px 0 4px');

    [
        { label: 'Police (manual detection)',    color: config.colors.police },
        { label: 'Camera (automated detection)', color: config.colors.camera },
        { label: 'Charges',                      color: '#ffa502' },
        { label: 'Arrests',                      color: '#ff6b9d' },
    ].forEach(function(item) {
        const el = legendDiv.append('div')
            .style('display', 'flex').style('align-items', 'center').style('gap', '7px');
        el.append('div')
            .style('width', '14px').style('height', '14px').style('border-radius', '3px')
            .style('background-color', item.color).style('opacity', '0.88').style('flex-shrink', '0');
        el.append('span')
            .style('font-size', '12px').style('color', 'var(--text-primary)').text(item.label);
    });
}

export { renderDivergingChart as updateEnforcementChart };