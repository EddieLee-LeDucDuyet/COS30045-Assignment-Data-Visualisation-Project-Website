// ===========================
// Main Application
// Initialize and coordinate all modules
// ===========================

import { loadData } from './utils/dataLoader.js';
import { initTooltip } from './utils/tooltip.js';
import { createStatsDashboard } from './charts/statsDashboard.js';
import { createHistoricalTrendChart } from './charts/trendChart.js';
import { createEnforcementChart } from './charts/enforcementChart.js';

// State management
const appState = {
    dataLoaded: false,
    currentSection: 'overview',
    renderedSections: new Set()
};

async function init() {
    console.log('Initializing Australian Enforcement Visualization...');

    const initialLoader = document.getElementById('initialLoader');
    if (initialLoader) {
        setTimeout(() => {
            initialLoader.classList.add('hidden');
            setTimeout(() => initialLoader.remove(), 300);
        }, 100);
    }

    try {
        initializeNavigation();
        initTooltip();

        await loadData();
        appState.dataLoaded = true;

        document.querySelector('.main-content').style.opacity = '1';

        renderSection('overview');

        console.log('Application initialized successfully!');

    } catch (error) {
        console.error('Failed to initialize application:', error);
        showError(error.message);
    }
}

function renderSection(sectionId) {
    if (!appState.dataLoaded) return;
    if (appState.renderedSections.has(sectionId)) return;

    console.log('Rendering section: ' + sectionId);

    switch (sectionId) {
        case 'overview':
            createStatsDashboard();
            break;

        case 'trend':
            createHistoricalTrendChart();
            break;

        case 'enforcement':
            createEnforcementChart();
            break;

        case 'demographics':
            import('./charts/demographicsChart.js').then(({ createDemographicsChart }) => {
                createDemographicsChart();
            });
            break;

        case 'fines':
            import('./charts/fineshistogram.js').then(({ createFinesHistogram }) => {
                createFinesHistogram();
            });
            break;
    }

    appState.renderedSections.add(sectionId);
}

function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', function () {
            navigateToSection(this.getAttribute('data-section'));
        });
    });
}

function navigateToSection(sectionId) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-section="' + sectionId + '"]').classList.add('active');

    document.querySelectorAll('.story-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    appState.currentSection = sectionId;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    renderSection(sectionId);
}

function showError(message) {
    const main = document.querySelector('.main-content');
    const error = document.createElement('div');
    error.className = 'error-message';
    error.innerHTML =
        '<div class="error-content">' +
        '<h2>&#9888;&#65039; Error Loading Data</h2>' +
        '<p>' + message + '</p>' +
        '<p>Please ensure:</p>' +
        '<ul>' +
        '<li>The file <code>ed.csv</code> is in the <code>data/</code> folder</li>' +
        '<li>You\'re running a local web server (not opening the file directly)</li>' +
        '<li>The CSV has the correct column headers</li>' +
        '</ul>' +
        '<button onclick="location.reload()">Retry</button>' +
        '</div>';
    main.innerHTML = '';
    main.appendChild(error);
}

function handleResize() {
    if (!appState.dataLoaded) return;
    appState.renderedSections.delete(appState.currentSection);
    renderSection(appState.currentSection);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 250);
});

window.appState = appState;