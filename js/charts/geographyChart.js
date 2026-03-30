// ===========================
// Geography Chart
// Treemap showing geographic distribution
// ===========================

import { config } from '../modules/config.js';
import { getGeographicDistribution } from '../utils/dataLoader.js';
import { formatNumber, getChartDimensions, formatPercentage } from '../utils/helpers.js';
import { showTooltip, hideTooltip } from '../utils/tooltip.js';

export function createGeographyChart() {
    const jurisdictionSelect = document.getElementById('geo-jurisdiction');
    jurisdictionSelect.addEventListener('change', updateChart);
    updateChart();
}

function updateChart() {
    const jurisdiction = document.getElementById('geo-jurisdiction').value;
    const container = document.getElementById('geography-chart');
    const dims = getChartDimensions(container, { top: 0, right: 0, bottom: 0, left: 0 });
    
    d3.select('#geography-chart').selectAll('*').remove();
    
    const data = getGeographicDistribution(jurisdiction, 2024);
    
    if (data.length === 0) {
        d3.select('#geography-chart').append('p')
            .style('text-align', 'center')
            .style('padding', '50px')
            .style('color', '#e74c3c')
            .html(`
                <strong>⚠️ No detailed location data available</strong><br><br>
                <span style="color: #7f8c8d;">
                    ${jurisdiction} only reports aggregate "General" totals for 2024.<br>
                    Try selecting: <strong>NSW, VIC, SA, or ACT</strong> for detailed location breakdowns.
                </span>
            `);
        return;
    }
    
    const root = d3.hierarchy({
        name: 'root',
        children: data.map(d => ({
            name: d.location,
            value: d.fines
        }))
    })
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);
    
    const treemap = d3.treemap()
        .size([dims.width, dims.height])
        .padding(2)
        .round(true);
    
    treemap(root);
    
    const colorScale = d3.scaleSequential()
        .domain([0, d3.max(root.leaves(), d => d.value)])
        .interpolator(d3.interpolateBlues);
    
    const svg = d3.select('#geography-chart')
        .append('svg')
        .attr('width', dims.width)
        .attr('height', dims.height);
    
    const cell = svg.selectAll('g')
        .data(root.leaves())
        .join('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);
    
    cell.append('rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => colorScale(d.value))
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.7);
            showTooltip(`
                <strong>${d.data.name}</strong><br>
                Fines: ${formatNumber(d.value)}<br>
                ${formatPercentage(d.value, root.value)} of total
            `, event);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            hideTooltip();
        });
    
    cell.append('text')
        .attr('x', 5)
        .attr('y', 20)
        .text(d => (d.x1 - d.x0) > 100 ? d.data.name : '')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('fill', 'white')
        .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)');
    
    cell.append('text')
        .attr('x', 5)
        .attr('y', 40)
        .text(d => (d.x1 - d.x0) > 80 ? formatNumber(d.value) : '')
        .attr('font-size', '14px')
        .attr('font-weight', '700')
        .attr('fill', 'white')
        .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)');
}