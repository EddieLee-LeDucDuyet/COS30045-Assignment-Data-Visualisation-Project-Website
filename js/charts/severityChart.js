// ===========================
// Severity Chart
// Bubble chart showing fines vs charges
// ===========================

import { config } from '../modules/config.js';
import { filterData } from '../utils/dataLoader.js';
import { formatNumber, getChartDimensions } from '../utils/helpers.js';
import { showTooltip, hideTooltip } from '../utils/tooltip.js';

export function createSeverityChart() {
    const yearSelect = document.getElementById('severity-year');
    const logScaleCheckbox = document.getElementById('log-scale');
    
    yearSelect.addEventListener('change', updateChart);
    logScaleCheckbox.addEventListener('change', updateChart);
    
    updateChart();
}

function updateChart() {
    const year = +document.getElementById('severity-year').value;
    const useLogScale = document.getElementById('log-scale').checked;
    const container = document.getElementById('severity-chart');
    const dims = getChartDimensions(container, config.margin);
    
    d3.select('#severity-chart').selectAll('*').remove();
    
    const data = filterData({
        year,
        location: 'Major Cities of Australia',
        excludeAgeGroups: ['All ages', '0-65+'],
        minFines: 1
    });
    
    if (data.length === 0) {
        d3.select('#severity-chart').append('p')
            .style('text-align', 'center')
            .style('padding', '50px')
            .text('No data available for this year');
        return;
    }
    
    const svg = d3.select('#severity-chart')
        .append('svg')
        .attr('width', dims.width)
        .attr('height', dims.height);
    
    const g = svg.append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);
    
    const xExtent = d3.extent(data, d => d.fines);
    const yExtent = d3.extent(data, d => d.charges);
    
    let xScale, yScale;
    
    if (useLogScale) {
        xScale = d3.scaleLog()
            .domain([Math.max(1, xExtent[0]), xExtent[1]])
            .range([0, dims.innerWidth])
            .nice();
        
        yScale = d3.scaleLog()
            .domain([Math.max(1, yExtent[0] || 1), Math.max(10, yExtent[1])])
            .range([dims.innerHeight, 0])
            .nice();
    } else {
        xScale = d3.scaleLinear()
            .domain([0, xExtent[1]])
            .range([0, dims.innerWidth])
            .nice();
        
        yScale = d3.scaleLinear()
            .domain([0, Math.max(yExtent[1] || 100, 10)])
            .range([dims.innerHeight, 0])
            .nice();
    }
    
    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.arrests)])
        .range([3, 30]);
    
    g.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${dims.innerHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(formatNumber))
        .append('text')
        .attr('x', dims.innerWidth / 2)
        .attr('y', 40)
        .attr('fill', 'currentColor')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('text-anchor', 'middle')
        .text('Number of Fines' + (useLogScale ? ' (log scale)' : ''));
    
    g.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(yScale).tickFormat(formatNumber))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -dims.innerHeight / 2)
        .attr('y', -60)
        .attr('fill', 'currentColor')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('text-anchor', 'middle')
        .text('Number of Charges' + (useLogScale ? ' (log scale)' : ''));
    
    g.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yScale).tickSize(-dims.innerWidth).tickFormat(''));
    
    g.selectAll('.bubble')
        .data(data)
        .join('circle')
        .attr('class', 'bubble')
        .attr('cx', d => xScale(Math.max(useLogScale ? 1 : 0, d.fines)))
        .attr('cy', d => yScale(Math.max(useLogScale ? 1 : 0, d.charges || (useLogScale ? 1 : 0))))
        .attr('r', d => sizeScale(d.arrests))
        .attr('fill', d => d.detectionMethod === 'Police' ? config.colors.police : config.colors.camera)
        .attr('opacity', 0.6)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1).attr('stroke-width', 3);
            showTooltip(`
                <strong>${d.jurisdiction} - ${d.ageGroup}</strong><br>
                Detection: ${d.detectionMethod}<br>
                Fines: ${formatNumber(d.fines)}<br>
                Charges: ${formatNumber(d.charges)}<br>
                Arrests: ${formatNumber(d.arrests)}
            `, event);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.6).attr('stroke-width', 2);
            hideTooltip();
        });
    
    const legendContainer = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${config.margin.left}, ${dims.height - 80})`);
    
    legendContainer.append('text')
        .attr('y', 0)
        .style('font-weight', '600')
        .style('fill', 'var(--text-primary)')
        .text('Detection Method:');
    
    ['Police', 'Camera'].forEach((method, i) => {
        legendContainer.append('circle')
            .attr('cx', 10 + i * 150)
            .attr('cy', 20)
            .attr('r', 8)
            .attr('fill', method === 'Police' ? config.colors.police : config.colors.camera)
            .attr('opacity', 0.6);
        
        legendContainer.append('text')
            .attr('x', 25 + i * 150)
            .attr('y', 25)
            .style('fill', 'var(--text-primary)')
            .text(method);
    });
    
    legendContainer.append('text')
        .attr('y', 50)
        .style('font-weight', '600')
        .style('fill', 'var(--text-primary)')
        .text('Bubble size = Arrests');
}