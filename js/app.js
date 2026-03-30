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
    // Track which sections have already been rendered
    renderedSections: new Set()
};

/**
 * Initialize the application
 */
async function init() {
    console.log('Initializing Australian Enforcement Visualization...');
    
    // Hide initial loader
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
        
        // Load data first, then render the active section
        await loadData();
        appState.dataLoaded = true;
        
        document.querySelector('.main-content').style.opacity = '1';
        
        // Only render the overview section on startup
        renderSection('overview');
        
        console.log('Application initialized successfully!');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showError(error.message);
    }
}

/**
 * Render the charts for a given section (only once per section)
 * @param {string} sectionId
 */
function renderSection(sectionId) {
    if (!appState.dataLoaded) return;
    // Skip if already rendered
    if (appState.renderedSections.has(sectionId)) return;

    console.log(`Rendering section: ${sectionId}`);

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

        case 'geography':
            import('./charts/geographyChart.js').then(({ createGeographyChart }) => {
                createGeographyChart();
            });
            break;

        case 'severity':
            import('./charts/severityChart.js').then(({ createSeverityChart }) => {
                createSeverityChart();
            });
            break;
    }

    appState.renderedSections.add(sectionId);
}

/**
 * Initialize navigation system
 */
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            navigateToSection(sectionId);
        });
    });
}

/**
 * Navigate to a section and lazy-render its chart on first visit
 * @param {string} sectionId
 */
function navigateToSection(sectionId) {
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    
    // Show the target section (gives it real dimensions)
    document.querySelectorAll('.story-section').forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    appState.currentSection = sectionId;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Now the container is visible — safe to measure and render
    renderSection(sectionId);
}

/**
 * Show error message
 * @param {string} message
 */
function showError(message) {
    const main = document.querySelector('.main-content');
    const error = document.createElement('div');
    error.className = 'error-message';
    error.innerHTML = `
        <div class="error-content">
            <h2>⚠️ Error Loading Data</h2>
            <p>${message}</p>
            <p>Please ensure:</p>
            <ul>
                <li>The file <code>ed.csv</code> is in the <code>data/</code> folder</li>
                <li>You're running a local web server (not opening the file directly)</li>
                <li>The CSV has the correct column headers</li>
            </ul>
            <button onclick="location.reload()">Retry</button>
        </div>
    `;
    main.innerHTML = '';
    main.appendChild(error);
}

/**
 * Handle window resize — re-render current section
 */
function handleResize() {
    if (!appState.dataLoaded) return;
    // Allow re-render on resize by clearing the current section from cache
    appState.renderedSections.delete(appState.currentSection);
    renderSection(appState.currentSection);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Handle window resize with debounce
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 250);
});

window.appState = appState;