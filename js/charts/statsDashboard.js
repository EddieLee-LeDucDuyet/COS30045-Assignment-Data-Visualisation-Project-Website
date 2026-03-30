// ===========================
// Stats Dashboard Chart
// Overview statistics display
// ===========================

import { filterData, aggregateData } from '../utils/dataLoader.js';
import { formatNumber, calculateStats } from '../utils/helpers.js';

/**
 * Create statistics dashboard
 * @param {string} containerId - Container element ID
 */
export function createStatsDashboard(containerId = 'stats-dashboard') {
    const container = d3.select(`#${containerId}`);
    
    // Get all data
    const allData = filterData({});
    
    // Calculate totals
    const totalFines = d3.sum(allData, d => d.fines);
    const totalCharges = d3.sum(allData, d => d.charges);
    const totalArrests = d3.sum(allData, d => d.arrests);
    
    // Find peak year
    const yearlyTotals = aggregateData(allData, ['year']);
    const peakYear = yearlyTotals.reduce((max, curr) => 
        curr.fines > max.fines ? curr : max
    );
    
    // Find camera introduction impact (NSW 2020)
    const nsw2019 = filterData({ 
        jurisdiction: 'NSW', 
        year: 2019,
        location: 'General',
        ageGroup: '0-65+'
    });
    const nsw2020Camera = filterData({ 
        jurisdiction: 'NSW', 
        year: 2020,
        location: 'General',
        detectionMethod: 'Camera'
    });
    
    const nsw2019Total = d3.sum(nsw2019, d => d.fines);
    const nsw2020CameraTotal = d3.sum(nsw2020Camera, d => d.fines);
    
    const stats = [
        { 
            value: formatNumber(totalFines), 
            label: 'Total Fines Issued',
            sublabel: '2008-2024'
        },
        { 
            value: formatNumber(totalCharges), 
            label: 'Total Charges Laid',
            sublabel: 'Across all jurisdictions'
        },
        { 
            value: formatNumber(totalArrests), 
            label: 'Total Arrests Made',
            sublabel: 'Police detections'
        },
        { 
            value: peakYear.year.toString(), 
            label: 'Peak Enforcement Year',
            sublabel: `${formatNumber(peakYear.fines)} fines`
        },
        { 
            value: formatNumber(nsw2020CameraTotal), 
            label: 'NSW Camera Fines (2020)',
            sublabel: `Up from ${formatNumber(nsw2019Total)} in 2019`
        },
        { 
            value: '8', 
            label: 'Jurisdictions Covered',
            sublabel: 'All states & territories'
        }
    ];
    
    // Clear existing
    container.selectAll('*').remove();
    
    // Create stat cards
    const cards = container
        .selectAll('.stat-card')
        .data(stats)
        .join('div')
        .attr('class', 'stat-card')
        .style('opacity', 0);
    
    cards.append('span')
        .attr('class', 'stat-value')
        .text(d => d.value);
    
    cards.append('span')
        .attr('class', 'stat-label')
        .text(d => d.label);
    
    cards.append('span')
        .attr('class', 'stat-sublabel')
        .text(d => d.sublabel);
    
    // Animate in
    cards.transition()
        .duration(500)
        .delay((d, i) => i * 100)
        .style('opacity', 1);
}

/**
 * Update stats dashboard with new filters
 * @param {string} containerId - Container element ID
 * @param {Object} filters - Filter options
 */
export function updateStatsDashboard(containerId, filters) {
    createStatsDashboard(containerId);
}
