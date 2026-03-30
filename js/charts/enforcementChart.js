// ===========================
// Enforcement Method Chart
// Stacked area chart comparing Police vs Camera
// ===========================

import { config } from '../modules/config.js';
import { filterData, aggregateData } from '../utils/dataLoader.js';
import { formatNumber, getChartDimensions } from '../utils/helpers.js';
import { showTooltip, hideTooltip } from '../utils/tooltip.js';

/**
 * Create enforcement method chart
 * @param {string} containerId - Container element ID
 * @param {string} sliderId - Slider control ID
 */
export function createEnforcementChart(containerId = 'enforcement-chart', sliderId = 'year-slider') {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById('year-display');
    
    slider.addEventListener('input', function() {
        display.textContent = this.value;
        updateEnforcementChart(containerId, +this.value);
    });
    
    updateEnforcementChart(containerId, +slider.value);
}

/**
 * Update enforcement chart for selected year
 * @param {string} containerId - Container element ID
 * @param {number} maxYear - Maximum year to display
 */
function updateEnforcementChart(containerId, maxYear) {
    const container = document.getElementById(containerId);
    const dims = getChartDimensions(container, config.margin);
    
    d3.select(`#${containerId}`).selectAll('*').remove();
    
    // Get data up to selected year
    const filtered = filterData({
        yearRange: [2008, maxYear],
        location: 'General',
        ageGroup: '0-65+'
    });
    
    // Aggregate by year and method
    const aggregated = aggregateData(filtered, ['year', 'detectionMethod']);
    
    // Transform to stacked format
    const years = d3.range(2008, maxYear + 1);
    const stackData = years.map(year => {
        const police = aggregated.find(d => d.year === year && d.detectionMethod === 'Police');
        const camera = aggregated.find(d => d.year === year && d.detectionMethod === 'Camera');
        
        return {
            year,
            Police: police ? police.fines : 0,
            Camera: camera ? camera.fines : 0
        };
    });
    
    // Create SVG
    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', dims.width)
        .attr('height', dims.height);
    
    const g = svg.append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain([2008, maxYear])
        .range([0, dims.innerWidth]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(stackData, d => d.Police + d.Camera)])
        .nice()
        .range([dims.innerHeight, 0]);
    
    // Axes
    g.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${dims.innerHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
        .append('text')
        .attr('x', dims.innerWidth / 2)
        .attr('y', 40)
        .attr('fill', 'currentColor')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('text-anchor', 'middle')
        .text('Year');
    
    g.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(yScale).tickFormat(d => formatNumber(d)))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -dims.innerHeight / 2)
        .attr('y', -60)
        .attr('fill', 'currentColor')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('text-anchor', 'middle')
        .text('Total Fines');
    
    // Stack generator
    const stack = d3.stack()
        .keys(['Police', 'Camera']);
    
    const stackedData = stack(stackData);
    
    // Area generator
    const area = d3.area()
        .x(d => xScale(d.data.year))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveMonotoneX);
    
    // Draw areas
    g.selectAll('.area')
        .data(stackedData)
        .join('path')
        .attr('class', 'area')
        .attr('d', area)
        .attr('fill', d => d.key === 'Police' ? config.colors.police : config.colors.camera)
        .attr('opacity', 0.8)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1);
            showTooltip(`<strong>${d.key} Detections</strong><br>Click to see details`, event);
        })
        .on('mousemove', function(event) {
            showTooltip(`<strong>${this.__data__.key} Detections</strong>`, event);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.8);
            hideTooltip();
        });
    
    // HTML legend BELOW the SVG (outside the chart)
    const legendDiv = d3.select(`#${containerId}`)
        .append('div')
        .attr('class', 'chart-legend-html')
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('gap', '20px')
        .style('justify-content', 'center')
        .style('padding', '12px 0 4px 0')
        .style('margin-top', '8px');

    ['Police', 'Camera'].forEach(method => {
        const item = legendDiv.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '8px');

        item.append('div')
            .style('width', '18px')
            .style('height', '18px')
            .style('border-radius', '3px')
            .style('background-color', method === 'Police' ? config.colors.police : config.colors.camera)
            .style('flex-shrink', '0');

        item.append('span')
            .style('font-size', '13px')
            .style('color', 'var(--text-primary)')
            .text(method);
    });
}

export { updateEnforcementChart };