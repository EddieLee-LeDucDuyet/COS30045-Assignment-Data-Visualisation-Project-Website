// ===========================
// Historical Trend Chart
// Multi-line chart showing trends over time
// ===========================

import { config, jurisdictionNames } from '../modules/config.js';
import { getYearlyTrends, filterData } from '../utils/dataLoader.js';
import { formatNumber, getChartDimensions } from '../utils/helpers.js';
import { showTooltip, hideTooltip } from '../utils/tooltip.js';

let selectedJurisdictions = new Set(['NSW', 'VIC', 'QLD']);

/**
 * Create historical trend chart
 * @param {string} containerId - Container element ID
 * @param {string} controlsId - Controls container ID
 */
export function createHistoricalTrendChart(containerId = 'trend-chart', controlsId = 'jurisdiction-controls') {
    initializeControls(controlsId);
    updateTrendChart(containerId);
}

/**
 * Initialize jurisdiction selection controls
 * @param {string} controlsId - Controls container ID
 */
function initializeControls(controlsId) {
    const controlsContainer = d3.select(`#${controlsId}`);
    const jurisdictions = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
    
    controlsContainer.selectAll('*').remove();
    
    const labels = controlsContainer
        .selectAll('.jurisdiction-checkbox')
        .data(jurisdictions)
        .join('label')
        .attr('class', d => selectedJurisdictions.has(d) ? 'jurisdiction-checkbox checked' : 'jurisdiction-checkbox')
        .on('change', function(event, d) {
            if (event.target.checked) {
                selectedJurisdictions.add(d);
                this.classList.add('checked');
            } else {
                selectedJurisdictions.delete(d);
                this.classList.remove('checked');
            }
            updateTrendChart('trend-chart');
        });
    
    labels.append('input')
        .attr('type', 'checkbox')
        .property('checked', d => selectedJurisdictions.has(d));
    
    labels.append('span')
        .text(d => d);
}

/**
 * Update trend chart with selected jurisdictions
 * @param {string} containerId - Container element ID
 */
function updateTrendChart(containerId) {
    const container = document.getElementById(containerId);
    const dims = getChartDimensions(container, config.margin);
    
    // Clear existing
    d3.select(`#${containerId}`).selectAll('*').remove();
    
    if (selectedJurisdictions.size === 0) {
        d3.select(`#${containerId}`)
            .append('p')
            .attr('class', 'empty-state')
            .style('text-align', 'center')
            .style('padding', '50px')
            .style('color', '#7f8c8d')
            .text('Please select at least one jurisdiction to display');
        return;
    }
    
    // Get trend data
    const trendData = getYearlyTrends([...selectedJurisdictions]);
    
    // Group by jurisdiction
    const grouped = d3.group(trendData, d => d.jurisdiction);
    const lineData = Array.from(grouped, ([jurisdiction, values]) => ({
        jurisdiction,
        values: values.sort((a, b) => a.year - b.year)
    }));
    
    // Create SVG
    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', dims.width)
        .attr('height', dims.height);
    
    const g = svg.append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(trendData, d => d.year))
        .range([0, dims.innerWidth]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(trendData, d => d.fines)])
        .nice()
        .range([dims.innerHeight, 0]);
    
    // Add grid
    g.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yScale)
            .tickSize(-dims.innerWidth)
            .tickFormat(''));
    
    // Add axes
    const xAxis = g.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${dims.innerHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')));
    
    xAxis.append('text')
        .attr('x', dims.innerWidth / 2)
        .attr('y', 40)
        .attr('fill', 'currentColor')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('text-anchor', 'middle')
        .text('Year');
    
    const yAxis = g.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(yScale).tickFormat(d => formatNumber(d)));
    
    yAxis.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -dims.innerHeight / 2)
        .attr('y', -60)
        .attr('fill', 'currentColor')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('text-anchor', 'middle')
        .text('Number of Fines');
    
    // Line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.fines))
        .curve(d3.curveMonotoneX);
    
    // Draw lines
    const lines = g.selectAll('.line-group')
        .data(lineData)
        .join('g')
        .attr('class', 'line-group');
    
    lines.append('path')
        .attr('class', 'line')
        .attr('d', d => line(d.values))
        .attr('stroke', d => config.colors.jurisdictions[d.jurisdiction])
        .attr('stroke-width', 2.5)
        .attr('fill', 'none')
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('stroke-width', 4)
                .raise();
            showTooltip(`<strong>${jurisdictionNames[d.jurisdiction] || d.jurisdiction}</strong>`, event);
        })
        .on('mousemove', function(event) {
            showTooltip(`<strong>${jurisdictionNames[this.__data__.jurisdiction] || this.__data__.jurisdiction}</strong>`, event);
        })
        .on('mouseout', function() {
            d3.select(this).attr('stroke-width', 2.5);
            hideTooltip();
        });
    
    // Add data points
    lines.each(function(lineData) {
        d3.select(this)
            .selectAll('.dot')
            .data(lineData.values)
            .join('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.year))
            .attr('cy', d => yScale(d.fines))
            .attr('r', 4)
            .attr('fill', config.colors.jurisdictions[lineData.jurisdiction])
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this).attr('r', 6);
                showTooltip(`
                    <strong>${jurisdictionNames[lineData.jurisdiction] || lineData.jurisdiction} - ${d.year}</strong><br>
                    Fines: ${formatNumber(d.fines)}<br>
                    Charges: ${formatNumber(d.charges)}<br>
                    Arrests: ${formatNumber(d.arrests)}
                `, event);
            })
            .on('mousemove', function(event, d) {
                showTooltip(`
                    <strong>${jurisdictionNames[lineData.jurisdiction] || lineData.jurisdiction} - ${d.year}</strong><br>
                    Fines: ${formatNumber(d.fines)}<br>
                    Charges: ${formatNumber(d.charges)}<br>
                    Arrests: ${formatNumber(d.arrests)}
                `, event);
            })
            .on('mouseout', function() {
                d3.select(this).attr('r', 4);
                hideTooltip();
            });
    });
    
    // Add annotation for NSW 2020 if selected
    if (selectedJurisdictions.has('NSW')) {
        const nswLine = lineData.find(d => d.jurisdiction === 'NSW');
        if (nswLine) {
            const point2020 = nswLine.values.find(v => v.year === 2020);
            if (point2020) {
                const x = xScale(2020);
                const y = yScale(point2020.fines);
                
                // Annotation label at the top of the chart
                g.append('text')
                    .attr('class', 'annotation-text')
                    .attr('x', x - 20)
                    .attr('y', 12)
                    .attr('fill', '#e74c3c')
                    .style('font-size', '12px')
                    .style('font-weight', '600')
                    .text('Camera introduction');
                
                // Annotation line goes from top of chart to x-axis
                g.append('line')
                    .attr('class', 'annotation-line')
                    .attr('x1', x)
                    .attr('y1', 0)
                    .attr('x2', x)
                    .attr('y2', dims.innerHeight)
                    .attr('stroke', '#e74c3c')
                    .attr('stroke-width', 2)
                    .attr('stroke-dasharray', '5,5');

                // Arrow head at the bottom
                g.append('polygon')
                    .attr('points', `${x - 5},${dims.innerHeight - 10} ${x + 5},${dims.innerHeight - 10} ${x},${dims.innerHeight}`)
                    .attr('fill', '#e74c3c');
            }
        }
    }
    
    // Create HTML legend BELOW the SVG (outside the chart)
    const legendDiv = d3.select(`#${containerId}`)
        .append('div')
        .attr('class', 'chart-legend-html')
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('gap', '12px')
        .style('justify-content', 'center')
        .style('padding', '12px 0 4px 0')
        .style('margin-top', '8px');

    lineData.forEach(d => {
        const item = legendDiv.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '6px')
            .style('cursor', 'pointer')
            .on('click', function() {
                const checkbox = document.querySelector(`#jurisdiction-controls input[value="${d.jurisdiction}"]`);
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });

        item.append('div')
            .style('width', '18px')
            .style('height', '18px')
            .style('border-radius', '3px')
            .style('background-color', config.colors.jurisdictions[d.jurisdiction])
            .style('flex-shrink', '0');

        item.append('span')
            .style('font-size', '13px')
            .style('color', 'var(--text-primary)')
            .text(d.jurisdiction);
    });
}

/**
 * Export function to get selected jurisdictions
 * @returns {Set} Set of selected jurisdiction codes
 */
export function getSelectedJurisdictions() {
    return new Set(selectedJurisdictions);
}