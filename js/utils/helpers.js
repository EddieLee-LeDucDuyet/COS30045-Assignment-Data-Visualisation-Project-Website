// ===========================
// Utility Functions Module
// Helper functions used across the application
// ===========================

/**
 * Format large numbers with K/M suffixes
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
}

/**
 * Format percentage
 * @param {number} value - The value
 * @param {number} total - The total
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, total) {
    if (total === 0) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
}

/**
 * Get responsive dimensions for charts
 * @param {HTMLElement} container - Container element
 * @param {Object} margin - Margin object
 * @returns {Object} Dimensions object
 */
export function getChartDimensions(container, margin) {
    const width = container.clientWidth;
    const height = Math.max(500, Math.min(600, width * 0.5)); // Responsive height
    
    return {
        width: width,
        height: height,
        innerWidth: width - margin.left - margin.right,
        innerHeight: height - margin.top - margin.bottom
    };
}

/**
 * Sort data by age group in logical order
 * @param {Array} data - Data array with ageGroup property
 * @param {Array} order - Age group order array
 * @returns {Array} Sorted data
 */
export function sortByAgeGroup(data, order) {
    return data.sort((a, b) => {
        const aIndex = order.indexOf(a.ageGroup);
        const bIndex = order.indexOf(b.ageGroup);
        return aIndex - bIndex;
    });
}

/**
 * Sort data by location in logical order
 * @param {Array} data - Data array with location property
 * @param {Array} order - Location order array
 * @returns {Array} Sorted data
 */
export function sortByLocation(data, order) {
    return data.sort((a, b) => {
        const aIndex = order.indexOf(a.location);
        const bIndex = order.indexOf(b.location);
        return aIndex - bIndex;
    });
}

/**
 * Calculate year-over-year change
 * @param {number} current - Current year value
 * @param {number} previous - Previous year value
 * @returns {Object} Change object with value and percentage
 */
export function calculateChange(current, previous) {
    if (previous === 0) return { value: current, percentage: 100 };
    const change = current - previous;
    const percentage = (change / previous) * 100;
    return {
        value: change,
        percentage: percentage,
        formatted: `${change >= 0 ? '+' : ''}${formatNumber(change)} (${percentage.toFixed(1)}%)`
    };
}

/**
 * Debounce function for performance
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Create a safe ID from a string
 * @param {string} str - String to convert
 * @returns {string} Safe ID string
 */
export function createSafeId(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

/**
 * Get color based on value scale
 * @param {number} value - Value to scale
 * @param {number} max - Maximum value
 * @param {string} baseColor - Base color in hex
 * @returns {string} RGB color string
 */
export function getScaledColor(value, max, baseColor) {
    const intensity = value / max;
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Scale towards white for lower values
    const newR = Math.round(r + (255 - r) * (1 - intensity));
    const newG = Math.round(g + (255 - g) * (1 - intensity));
    const newB = Math.round(b + (255 - b) * (1 - intensity));
    
    return `rgb(${newR}, ${newG}, ${newB})`;
}

/**
 * Find peak value in time series
 * @param {Array} data - Data array
 * @param {string} valueKey - Key for value
 * @param {string} yearKey - Key for year
 * @returns {Object} Peak object
 */
export function findPeakValue(data, valueKey = 'fines', yearKey = 'year') {
    if (!data || data.length === 0) return null;
    
    return data.reduce((peak, current) => {
        return current[valueKey] > peak[valueKey] ? current : peak;
    });
}

/**
 * Calculate summary statistics
 * @param {Array} data - Data array
 * @param {string} key - Key to summarize
 * @returns {Object} Statistics object
 */
export function calculateStats(data, key = 'fines') {
    if (!data || data.length === 0) {
        return { sum: 0, mean: 0, median: 0, min: 0, max: 0 };
    }
    
    const values = data.map(d => d[key]).filter(v => !isNaN(v));
    const sum = d3.sum(values);
    const mean = d3.mean(values);
    const median = d3.median(values);
    const min = d3.min(values);
    const max = d3.max(values);
    
    return { sum, mean, median, min, max };
}

/**
 * Group data by multiple keys
 * @param {Array} data - Data array
 * @param {Array} keys - Array of key strings
 * @returns {Map} Nested Map structure
 */
export function groupByMultiple(data, keys) {
    if (keys.length === 0) return data;
    
    const [firstKey, ...restKeys] = keys;
    const grouped = d3.group(data, d => d[firstKey]);
    
    if (restKeys.length === 0) return grouped;
    
    // Recursively group by remaining keys
    const result = new Map();
    grouped.forEach((value, key) => {
        result.set(key, groupByMultiple(value, restKeys));
    });
    
    return result;
}
