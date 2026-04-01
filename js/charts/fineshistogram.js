// ===========================
// Fines Histogram Chart
// Stacked bar chart: total fines per year (2008-2024)
// Stack: Police (bottom) + Camera (top)
// ===========================

import { config } from '../modules/config.js';
import { getYearlyTrendsByMethod } from '../utils/dataLoader.js';
import { formatNumber, getChartDimensions } from '../utils/helpers.js';
import { showTooltip, hideTooltip } from '../utils/tooltip.js';

export function createFinesHistogram(containerId = 'fines-chart') {
    renderHistogram(containerId);
}

function renderHistogram(containerId) {
    const container = document.getElementById(containerId);
    d3.select('#' + containerId).selectAll('*').remove();

    // ── Data ─────────────────────────────────────────────────────────────────
    const aggregated = getYearlyTrendsByMethod([2008, 2024]);

    const years = d3.range(2008, 2025);
    const stackData = years.map(year => {
        const polRow = aggregated.find(d => d.year === year && d.detectionMethod === 'Police');
        const camRow = aggregated.find(d => d.year === year && d.detectionMethod === 'Camera');
        const police = polRow ? polRow.fines : 0;
        const camera = camRow ? camRow.fines : 0;
        return { year, police, camera, total: police + camera };
    });

    // ── Layout ────────────────────────────────────────────────────────────────
    const margin   = { top: 60, right: 30, bottom: 70, left: 90 };
    const width    = container.clientWidth || 900;
    const height   = Math.max(480, Math.min(580, width * 0.52));
    const innerW   = width  - margin.left - margin.right;
    const innerH   = height - margin.top  - margin.bottom;

    // ── Scales ────────────────────────────────────────────────────────────────
    const xScale = d3.scaleBand()
        .domain(years)
        .range([0, innerW])
        .padding(0.18);

    const yMax = d3.max(stackData, d => d.total) || 1;
    const yScale = d3.scaleLinear()
        .domain([0, yMax * 1.12]).nice()
        .range([innerH, 0]);

    // D3 stack
    const stack = d3.stack().keys(['police', 'camera']);
    const series = stack(stackData);

    // ── SVG ───────────────────────────────────────────────────────────────────
    const svg = d3.select('#' + containerId)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Chart title
    g.append('text')
        .attr('x', innerW / 2).attr('y', -34)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px').style('font-weight', '700')
        .style('fill', 'var(--text-primary)')
        .text('Total Fines Issued Across Australia (2008\u20132024)');

    g.append('text')
        .attr('x', innerW / 2).attr('y', -14)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px').style('fill', 'var(--text-secondary)')
        .text('All jurisdictions combined \u00b7 stacked by detection method');

    // ── Grid ──────────────────────────────────────────────────────────────────
    g.append('g').attr('class', 'grid').attr('opacity', 0.1)
        .call(d3.axisLeft(yScale).tickSize(-innerW).tickFormat(''));

    // ── Stacked bars ──────────────────────────────────────────────────────────
    const colors = { police: config.colors.police, camera: config.colors.camera };

    g.selectAll('.series')
        .data(series)
        .join('g')
        .attr('class', 'series')
        .attr('fill', d => colors[d.key])
        .selectAll('rect')
        .data(d => d.map(v => ({ ...v, key: d.key })))
        .join('rect')
        .attr('x',      d => xScale(d.data.year))
        .attr('y',      d => yScale(d[1]))
        .attr('height', d => Math.max(0, yScale(d[0]) - yScale(d[1])))
        .attr('width',  xScale.bandwidth())
        .attr('opacity', 0.88)
        .attr('rx', 2)
        .on('mouseover', function (event, d) {
            d3.select(this).attr('opacity', 1);
            const label = d.key === 'police' ? 'Police' : 'Camera';
            const val   = d.key === 'police' ? d.data.police : d.data.camera;
            showTooltip(
                '<strong>' + d.data.year + ' \u2014 ' + label + '</strong><br>' +
                'Fines: ' + formatNumber(val) + '<br>' +
                '<span style="color:var(--text-secondary)">Total: ' + formatNumber(d.data.total) + '</span>',
                event
            );
        })
        .on('mouseout', function () {
            d3.select(this).attr('opacity', 0.88);
            hideTooltip();
        });

    // ── Total labels above each bar ───────────────────────────────────────────
    // Only show if bar is wide enough (skip very narrow bars)
    const minLabelBarW = 24;
    g.selectAll('.total-label')
        .data(stackData)
        .join('text')
        .attr('class', 'total-label')
        .attr('x', d => xScale(d.year) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.total) - 6)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px').style('font-weight', '600')
        .style('fill', 'var(--text-secondary)').style('pointer-events', 'none')
        .text(d => xScale.bandwidth() >= minLabelBarW ? formatNumber(d.total) : '');

    // ── X axis ────────────────────────────────────────────────────────────────
    g.append('g').attr('class', 'axis')
        .attr('transform', 'translate(0,' + innerH + ')')
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
        .selectAll('text')
        .style('font-size', '11px')
        .attr('transform', 'rotate(-35)')
        .attr('text-anchor', 'end')
        .attr('dx', '-0.5em')
        .attr('dy', '0.3em');

    g.append('text')
        .attr('x', innerW / 2).attr('y', innerH + 62)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px').style('font-weight', '600').style('fill', 'currentColor')
        .text('Year');

    // ── Y axis ────────────────────────────────────────────────────────────────
    g.append('g').attr('class', 'axis')
        .call(d3.axisLeft(yScale).tickFormat(formatNumber));

    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2).attr('y', -72)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px').style('font-weight', '600').style('fill', 'currentColor')
        .text('Total Fines Issued');

    // ── Camera introduction annotation (2020) ─────────────────────────────────
    const x2020 = xScale(2020) + xScale.bandwidth() / 2;

    g.append('line')
        .attr('x1', x2020).attr('x2', x2020)
        .attr('y1', 0).attr('y2', innerH)
        .attr('stroke', '#ff6b9d').attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,4').attr('opacity', 0.8);

    // Arrow pointing down into the bar
    g.append('polygon')
        .attr('points',
            (x2020 - 5) + ',' + 8 + ' ' +
            (x2020 + 5) + ',' + 8 + ' ' +
            x2020 + ',18')
        .attr('fill', '#ff6b9d').attr('opacity', 0.9);

    g.append('text')
        .attr('x', x2020 - 8).attr('y', 10)
        .attr('text-anchor', 'end')
        .style('font-size', '11px').style('font-weight', '700').style('fill', '#ff6b9d')
        .text('Camera introduced');

    // ── Peak year annotation ───────────────────────────────────────────────────
    const peakYear = stackData.reduce((p, d) => d.total > p.total ? d : p);
    if (peakYear.year !== 2020) {
        const xPeak = xScale(peakYear.year) + xScale.bandwidth() / 2;
        g.append('text')
            .attr('x', xPeak)
            .attr('y', yScale(peakYear.total) - 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px').style('font-weight', '700').style('fill', '#ffa502')
            .text('\u2605 Peak: ' + formatNumber(peakYear.total));
    }

    // ── Legend ────────────────────────────────────────────────────────────────
    const legendDiv = d3.select('#' + containerId)
        .append('div')
        .style('display', 'flex').style('flex-wrap', 'wrap').style('gap', '24px')
        .style('justify-content', 'center').style('padding', '14px 0 4px');

    [
        { label: 'Police (manual detection)',    color: config.colors.police  },
        { label: 'Camera (automated detection)', color: config.colors.camera  },
    ].forEach(function (item) {
        const el = legendDiv.append('div')
            .style('display', 'flex').style('align-items', 'center').style('gap', '8px');
        el.append('div')
            .style('width', '16px').style('height', '16px').style('border-radius', '3px')
            .style('background-color', item.color).style('opacity', '0.88').style('flex-shrink', '0');
        el.append('span')
            .style('font-size', '13px').style('color', 'var(--text-primary)').text(item.label);
    });
}