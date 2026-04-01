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
        
        const rawData = await d3.csv('data/ed.csv', (d) => {
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
 * @returns {Array} Aggregated data
 */
export function aggregateData(data, groupKeys) {
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
    
    function flatten(arr, keys, level = 0) {
        if (level === keys.length) return arr;
        return arr.flatMap(([key, value]) => {
            if (level === keys.length - 1) {
                return [{ [keys[level]]: key, ...value }];
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
 * Get yearly trends for jurisdictions.
 *
 * The dataset has two structural eras:
 *
 *   2008-2022: every jurisdiction reports a single row per year with
 *              location = 'General' and ageGroup = '0-65+' (aggregate).
 *
 *   2023-2024: most jurisdictions switched to individual age-group rows
 *              (17-25, 26-39, 40-64, etc.) and some changed location too
 *              (ACT moved to 'Major Cities of Australia'; NSW/VIC/SA added
 *              multiple locations). Some also kept a residual '0-65+' row
 *              alongside individual rows (NSW Camera, QLD 2024) -- summing
 *              both would double-count.
 *
 * Affected jurisdictions whose lines stopped early with the old filter:
 *   ACT  -- stops at 2022 (switched location AND age group in 2023)
 *   NT   -- stops at 2022 (switched to individual age groups in 2023)
 *   QLD  -- stops at 2023 (switched to individual age groups in 2024)
 *   SA   -- stops at 2022 (switched to individual age groups in 2023)
 *   TAS  -- stops at 2022 (switched to individual age groups in 2023)
 *   WA   -- stops at 2022 (switched to individual age groups in 2023)
 *
 * Strategy per (jurisdiction, year):
 *   1. Collect ALL rows for that jurisdiction+year (no location or age filter).
 *   2. If ANY row has a specific age group (not '0-65+' / 'All ages')
 *      -> sum only those specific-age rows  (avoids double-counting the
 *         residual aggregate rows that some jurisdictions keep alongside)
 *   3. Otherwise -> sum the aggregate '0-65+' rows as before.
 *
 * This gives correct, continuous totals for every jurisdiction across all
 * 17 years without any hard-coded list of affected states.
 *
 * @param {string[]} jurisdictions
 * @returns {Array} rows: { jurisdiction, year, fines, arrests, charges }
 */
export function getYearlyTrends(jurisdictions) {
    const AGGREGATE_AGE_LABELS = ['0-65+', 'All ages'];

    // Pull everything for the requested jurisdictions -- no location or age filter
    const allRows = filterData({ jurisdictions });

    // Group by jurisdiction then year
    const byJurYear = d3.rollups(
        allRows,
        rows => {
            // Check whether this jurisdiction+year has individual age-group rows
            const hasIndividual = rows.some(
                d => !AGGREGATE_AGE_LABELS.includes(d.ageGroup)
            );
            // Use individual rows if available (excludes aggregate to prevent double-count)
            const relevant = hasIndividual
                ? rows.filter(d => !AGGREGATE_AGE_LABELS.includes(d.ageGroup))
                : rows;
            return {
                fines:   d3.sum(relevant, d => d.fines),
                arrests: d3.sum(relevant, d => d.arrests),
                charges: d3.sum(relevant, d => d.charges),
            };
        },
        d => d.jurisdiction,
        d => d.year
    );

    // Flatten nested rollup [[jur, [[year, vals], ...]], ...] -> flat array
    return byJurYear.flatMap(([jurisdiction, years]) =>
        years.map(([year, vals]) => ({ jurisdiction, year, ...vals }))
    );
}

/**
 * Get detection method comparison
 */
export function getDetectionMethodComparison(year) {
    const filtered = filterData({
        year,
        location: config.dataFilters.generalLocation
    });
    return aggregateData(filtered, ['detectionMethod']);
}

/**
 * Get demographic breakdown for a jurisdiction and year.
 *
 * Location structure varies widely across jurisdictions and years:
 *
 *   Jurisdiction | 2023 locations              | 2024 locations
 *   -------------|-----------------------------|---------------------------------
 *   ACT          | Major Cities only           | Major Cities only
 *   NSW          | General + Major Cities + …  | General + Major Cities + …
 *   NT           | General only                | General only
 *   QLD          | General only (0-65+ only!)  | General only (full age groups)
 *   SA           | General only                | General + Major Cities + …
 *   TAS          | General only                | General only
 *   VIC          | General + Major Cities + …  | General + Major Cities + …
 *   WA           | General only                | General only
 *
 * Critically, for VIC (and sometimes NSW), Police detections are recorded
 * under "General" while Camera detections are recorded under "Major Cities"
 * or other locations — so filtering to any single location would hide one
 * of the two detection-method bars entirely.
 *
 * Solution: always aggregate across ALL locations for the given jurisdiction
 * and year. This ensures both Police and Camera bars are always visible
 * regardless of how the source data distributes records across locations.
 *
 * '0-65+' is intentionally kept so it appears as its own bar.
 * Only the synthetic label 'All ages' is excluded.
 *
 * @param {string} jurisdiction
 * @param {number} year
 * @returns {Array} rows: { ageGroup, detectionMethod, fines, arrests, charges }
 */
export function getDemographicBreakdown(jurisdiction, year) {
    const data = filterData({
        jurisdiction,
        year,
        excludeAgeGroups: ['All ages']
    });
    return aggregateData(data, ['ageGroup', 'detectionMethod']);
}

/**
 * Build a human-readable subtitle describing the location scope
 * used for a jurisdiction/year, for display below the chart title.
 *
 * @param {string} jurisdiction
 * @param {number} year
 * @returns {string}
 */
export function getDemographicLocationLabel(jurisdiction, year) {
    const data = filterData({ jurisdiction, year });
    const locations = [...new Set(data.map(d => d.location))].filter(Boolean);

    if (locations.length === 0) return '';
    if (locations.length === 1) {
        return locations[0] === 'General'
            ? 'All Locations (General reporting)'
            : locations[0];
    }
    return `All Locations aggregated (${locations.length} location types)`;
}

/**
 * Get geographic distribution
 */
export function getGeographicDistribution(jurisdiction, year) {
    const filtered = filterData({
        jurisdiction,
        year,
        excludeAgeGroups: ['0-65+', 'All ages']
    });
    const withoutGeneral = filtered.filter(d => d.location !== 'General');
    return aggregateData(withoutGeneral, ['location']);
}

export function getAvailableYears() {
    if (!cachedData) return [];
    return [...new Set(cachedData.map(d => d.year))].sort();
}

export function getAvailableJurisdictions() {
    if (!cachedData) return [];
    return [...new Set(cachedData.map(d => d.jurisdiction))].sort();
}

export function clearCache() {
    cachedData = null;
}