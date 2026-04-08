// ===========================
// Stats Dashboard Chart
// Overview statistics display + storytelling intro
// ===========================

import { filterData, aggregateData } from '../utils/dataLoader.js';
import { formatNumber, calculateStats } from '../utils/helpers.js';
import { renderStory, ensureStoryPanel } from './storyTelling.js';

// Overview story — shown once on the Overview tab
const OVERVIEW_STORY = {
    headline: 'Australian Mobile Phone Enforcement: 2008–2024',
    body: 'Between 2008 and 2024 Australia issued over 2.5 million mobile phone fines across all states and territories. The data tells two very different stories: a slow decade of police-only enforcement gradually declining from its 2010 peak, and then a sudden, dramatic transformation from 2020 when NSW deployed the world\'s first AI-powered mobile phone detection cameras at scale. What took thousands of officers years to achieve, cameras now do in weeks.',
};

// National overview data notes from the dictionary
const OVERVIEW_NOTES = [
    '📋 Data is collected from 8 agencies across all states and territories not all agencies collect the same metrics or make data publicly available.',
    '⚠️ Some states collect both police and camera-issued fines, but camera fines may be collected by a different government agency (e.g. NSW Revenue, Access Canberra).',
    '🔢 Data is subject to revision. Monthly granularity, age groups, remoteness area and detection method detail were new additions from the 2023 collection.',
    '📅 Unlicensed driving data is a new field collected from 2023 onwards only.',
];

export function createStatsDashboard(containerId = 'stats-dashboard') {
    // Inject overview story above the stats cards
    ensureStoryPanel('overview', 'overview-story-panel', 'stats-dashboard');
    renderStory('overview-story-panel', OVERVIEW_STORY, OVERVIEW_NOTES);

    const container = d3.select(`#${containerId}`);

    // Get all data
    const allData = filterData({});

    // Calculate totals
    const totalFines   = d3.sum(allData, d => d.fines);
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

    const nsw2019Total      = d3.sum(nsw2019, d => d.fines);
    const nsw2020CameraTotal = d3.sum(nsw2020Camera, d => d.fines);

    const stats = [
        {
            value:    formatNumber(totalFines),
            label:    'Total Fines Issued',
            sublabel: '2008–2024, all jurisdictions'
        },
        {
            value:    formatNumber(totalCharges),
            label:    'Total Charges Laid',
            sublabel: 'Across all jurisdictions'
        },
        {
            value:    formatNumber(totalArrests),
            label:    'Total Arrests Made',
            sublabel: 'Police detections only'
        },
        {
            value:    peakYear.year.toString(),
            label:    'Peak Enforcement Year',
            sublabel: formatNumber(peakYear.fines) + ' fines'
        },
        {
            value:    formatNumber(nsw2020CameraTotal),
            label:    'NSW Camera Fines (2020)',
            sublabel: 'Up from ' + formatNumber(nsw2019Total) + ' in 2019'
        },
        {
            value:    '8',
            label:    'Jurisdictions Covered',
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
        .style('font-size', '0.8rem')
        .style('opacity', '0.75')
        .style('display', 'block')
        .style('margin-top', '4px')
        .text(d => d.sublabel);

    // Animate in
    cards.transition()
        .duration(500)
        .delay((d, i) => i * 100)
        .style('opacity', 1);
}

export function updateStatsDashboard(containerId, filters) {
    createStatsDashboard(containerId);
}