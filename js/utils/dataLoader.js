// ===========================
// Data Loader Module
// Handles CSV loading and data processing
// ===========================

import { config } from '../modules/config.js';

let cachedData = null;

/**
 * Load and parse CSV data
 * @returns {Promise<Array>} Processed data array
 */
export async function loadData() {
    if (cachedData) {
        console.log('Using cached data');
        return cachedData;
    }
    
    try {
        console.time('Data Loading');
        
        // Load CSV with optimized parsing
        const rawData = await d3.csv('data/ed.csv', (d) => {
            // Parse inline during CSV read for better performance
            return {
                year: +d.YEAR,
                jurisdiction: d.JURISDICTION,
                location: d.LOCATION,
                ageGroup: d.AGE_GROUP,
                detectionMethod: d.DETECTION_METHOD,
                fines: +d.FINES || 0,
                arrests: +d.ARRESTS || 0,
                charges: +d.CHARGES || 0
            };
        });
        
        // Filter invalid rows
        cachedData = rawData.filter(d => d.year && d.jurisdiction);
        
        console.timeEnd('Data Loading');
        console.log('Data loaded:', cachedData.length, 'records');
        console.log('Years:', d3.extent(cachedData, d => d.year));
        console.log('Jurisdictions:', [...new Set(cachedData.map(d => d.jurisdiction))]);
        
        return cachedData;
        
    } catch (error) {
        console.error('Error loading data:', error);
        throw new Error('Failed to load data. Please ensure ed.csv is in the data folder.');
    }
}

/**
 * Get data filtered by criteria
 * @param {Object} filters - Filter object
 * @returns {Array} Filtered data
 */
export function filterData(filters = {}) {
    if (!cachedData) {
        console.warn('Data not loaded yet');
        return [];
    }
    
    let filtered = [...cachedData];
    
    // Apply filters
    if (filters.year) {
        filtered = filtered.filter(d => d.year === filters.year);
    }
    
    if (filters.years) {
        filtered = filtered.filter(d => filters.years.includes(d.year));
    }
    
    if (filters.yearRange) {
        filtered = filtered.filter(d => 
            d.year >= filters.yearRange[0] && 
            d.year <= filters.yearRange[1]
        );
    }
    
    if (filters.jurisdiction) {
        filtered = filtered.filter(d => d.jurisdiction === filters.jurisdiction);
    }
    
    if (filters.jurisdictions) {
        filtered = filtered.filter(d => filters.jurisdictions.includes(d.jurisdiction));
    }
    
    if (filters.location) {
        filtered = filtered.filter(d => d.location === filters.location);
    }
    
    if (filters.ageGroup) {
        filtered = filtered.filter(d => d.ageGroup === filters.ageGroup);
    }
    
    if (filters.detectionMethod) {
        filtered = filtered.filter(d => d.detectionMethod === filters.detectionMethod);
    }
    
    // Exclude filters
    if (filters.excludeAgeGroups) {
        filtered = filtered.filter(d => !filters.excludeAgeGroups.includes(d.ageGroup));
    }
    
    if (filters.minFines) {
        filtered = filtered.filter(d => d.fines >= filters.minFines);
    }
    
    return filtered;
}

/**
 * Get aggregated data by grouping keys
 * @param {Array} data - Data array
 * @param {Array} groupKeys - Keys to group by
 * @param {string} sumKey - Key to sum (default: 'fines')
 * @returns {Array} Aggregated data
 */
export function aggregateData(data, groupKeys, sumKey = 'fines') {
    const grouped = d3.rollups(
        data,
        v => ({
            fines: d3.sum(v, d => d.fines),
            arrests: d3.sum(v, d => d.arrests),
            charges: d3.sum(v, d => d.charges),
            count: v.length
        }),
        ...groupKeys.map(key => d => d[key])
    );
    
    // Flatten the nested structure
    function flatten(arr, keys, level = 0) {
        if (level === keys.length) {
            return arr;
        }
        
        return arr.flatMap(([key, value]) => {
            if (level === keys.length - 1) {
                return [{
                    [keys[level]]: key,
                    ...value
                }];
            }
            return flatten(value, keys, level + 1).map(item => ({
                [keys[level]]: key,
                ...item
            }));
        });
    }
    
    return flatten(grouped, groupKeys);
}

/**
 * Get yearly trends for jurisdictions
 * @param {Array} jurisdictions - Array of jurisdiction codes
 * @returns {Array} Trend data
 */
export function getYearlyTrends(jurisdictions) {
    const filtered = filterData({
        jurisdictions,
        location: config.dataFilters.generalLocation,
        ageGroup: config.dataFilters.allAges
    });
    
    return aggregateData(filtered, ['jurisdiction', 'year']);
}

/**
 * Get detection method comparison
 * @param {number} year - Year to compare
 * @returns {Array} Comparison data
 */
export function getDetectionMethodComparison(year) {
    const filtered = filterData({
        year,
        location: config.dataFilters.generalLocation
    });
    
    return aggregateData(filtered, ['detectionMethod']);
}

/**
 * Get demographic breakdown
 * @param {string} jurisdiction - Jurisdiction code
 * @param {number} year - Year
 * @returns {Array} Demographic data
 */
export function getDemographicBreakdown(jurisdiction, year) {
    const filtered = filterData({
        jurisdiction,
        year,
        location: config.dataFilters.majorCities,
        excludeAgeGroups: ['0-65+', 'All ages']
    });
    
    return aggregateData(filtered, ['ageGroup', 'detectionMethod']);
}

/**
 * Get geographic distribution
 * @param {string} jurisdiction - Jurisdiction code
 * @param {number} year - Year
 * @returns {Array} Geographic data
 */
export function getGeographicDistribution(jurisdiction, year) {
    const filtered = filterData({
        jurisdiction,
        year,
        excludeAgeGroups: ['0-65+', 'All ages']
    });
    
    // Exclude 'General' location
    const withoutGeneral = filtered.filter(d => d.location !== 'General');
    
    return aggregateData(withoutGeneral, ['location']);
}

/**
 * Get available years in dataset
 * @returns {Array} Sorted array of years
 */
export function getAvailableYears() {
    if (!cachedData) return [];
    return [...new Set(cachedData.map(d => d.year))].sort();
}

/**
 * Get available jurisdictions
 * @returns {Array} Sorted array of jurisdiction codes
 */
export function getAvailableJurisdictions() {
    if (!cachedData) return [];
    return [...new Set(cachedData.map(d => d.jurisdiction))].sort();
}

/**
 * Clear cached data (useful for reloading)
 */
export function clearCache() {
    cachedData = null;
}