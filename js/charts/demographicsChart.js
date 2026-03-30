// ===========================
// Demographics Chart
// Grouped bar chart for age groups
// ===========================

import { config, ageGroupOrder } from '../modules/config.js';
import { getDemographicBreakdown } from '../utils/dataLoader.js';
import { formatNumber, getChartDimensions, sortByAgeGroup } from '../utils/helpers.js';
import { showTooltip, hideTooltip } from '../utils/tooltip.js';

export function createDemographicsChart() {
    const jurisdictionSelect = document.getElementById('demo-jurisdiction');
    const yearSelect = document.getElementById('demo-year');
    
    jurisdictionSelect.addEventListener('change', updateChart);
    yearSelect.addEventListener('change', updateChart);
    
    updateChart();
}

function updateChart() {
    const jurisdiction = document.getElementById('demo-jurisdiction').value;
    const year = +document.getElementById('demo-year').value;
    const container = document.getElementById('demographics-chart');
    const dims = getChartDimensions(container, config.margin);
    
    d3.select('#demographics-chart').selectAll('*').remove();
    
    const data = getDemographicBreakdown(jurisdiction, year);
    
    if (data.length === 0) {
        d3.select('#demographics-chart').append('p')
            .style('text-align', 'center')
            .style('padding', '50px')
            .text('No data available for this selection');
        return;
    }
    
    // Group by age group
    const grouped = d3.group(data, d => d.ageGroup);
    const barData = Array.from(grouped, ([ageGroup, values]) => {
        const police = values.find(v => v.detectionMethod === 'Police');
        const camera = values.find(v => v.detectionMethod === 'Camera');
        return {
            ageGroup,
            Police: police ? police.fines : 0,
            Camera: camera ? camera.fines : 0
        };
    });
    
    sortByAgeGroup(barData, ageGroupOrder);
    
    const svg = d3.select('#demographics-chart')
        .append('svg')
        .attr('width', dims.width)
        .attr('height', dims.height);
    
    const g = svg.append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);
    
    const x0 = d3.scaleBand()
        .domain(barData.map(d => d.ageGroup))
        .range([0, dims.innerWidth])
        .padding(0.2);
    
    const x1 = d3.scaleBand()
        .domain(['Police', 'Camera'])
        .range([0, x0.bandwidth()])
        .padding(0.05);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(barData, d => Math.max(d.Police, d.Camera))])
        .nice()
        .range([dims.innerHeight, 0]);
    
    g.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${dims.innerHeight})`)
        .call(d3.axisBottom(x0));
    
    g.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(yScale).tickFormat(formatNumber));
    
    const ageGroups = g.selectAll('.age-group')
        .data(barData)
        .join('g')
        .attr('class', 'age-group')
        .attr('transform', d => `translate(${x0(d.ageGroup)},0)`);
    
    ageGroups.selectAll('rect')
        .data(d => ['Police', 'Camera'].map(method => ({
            method,
            value: d[method],
            ageGroup: d.ageGroup
        })))
        .join('rect')
        .attr('x', d => x1(d.method))
        .attr('y', d => yScale(d.value))
        .attr('width', x1.bandwidth())
        .attr('height', d => dims.innerHeight - yScale(d.value))
        .attr('fill', d => d.method === 'Police' ? config.colors.police : config.colors.camera)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.7);
            showTooltip(`
                <strong>${d.ageGroup} - ${d.method}</strong><br>
                Fines: ${formatNumber(d.value)}
            `, event);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            hideTooltip();
        });
}
