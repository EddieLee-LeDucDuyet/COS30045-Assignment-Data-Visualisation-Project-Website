// ===========================
// Tooltip Manager Module
// Centralized tooltip management
// ===========================

let tooltip = null;

/**
 * Initialize tooltip element
 */
export function initTooltip() {
    if (tooltip) return tooltip;
    
    tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('opacity', 0)
        .style('pointer-events', 'none');
    
    return tooltip;
}

/**
 * Show tooltip with content
 * @param {string} content - HTML content for tooltip
 * @param {Object} event - Mouse event
 */
export function showTooltip(content, event) {
    if (!tooltip) {
        tooltip = initTooltip();
    }
    
    tooltip
        .html(content)
        .transition()
        .duration(200)
        .style('opacity', 1);
    
    positionTooltip(event);
}

/**
 * Hide tooltip
 */
export function hideTooltip() {
    if (!tooltip) return;
    
    tooltip
        .transition()
        .duration(200)
        .style('opacity', 0);
}

/**
 * Position tooltip near mouse
 * @param {Object} event - Mouse event
 */
export function positionTooltip(event) {
    if (!tooltip) return;
    
    const tooltipNode = tooltip.node();
    const tooltipWidth = tooltipNode.offsetWidth;
    const tooltipHeight = tooltipNode.offsetHeight;
    
    let left = event.pageX + 15;
    let top = event.pageY - 28;
    
    // Check if tooltip goes off right edge
    if (left + tooltipWidth > window.innerWidth) {
        left = event.pageX - tooltipWidth - 15;
    }
    
    // Check if tooltip goes off bottom edge
    if (top + tooltipHeight > window.innerHeight + window.scrollY) {
        top = event.pageY - tooltipHeight - 15;
    }
    
    // Check if tooltip goes off top edge
    if (top < window.scrollY) {
        top = event.pageY + 15;
    }
    
    tooltip
        .style('left', left + 'px')
        .style('top', top + 'px');
}

/**
 * Update tooltip position on mouse move
 * @param {Object} event - Mouse event
 */
export function moveTooltip(event) {
    positionTooltip(event);
}

/**
 * Format tooltip content for data point
 * @param {Object} data - Data object
 * @param {Object} options - Formatting options
 * @returns {string} HTML string
 */
export function formatTooltipContent(data, options = {}) {
    const {
        title,
        items = [],
        formatValue = (v) => v
    } = options;
    
    let html = '';
    
    if (title) {
        html += `<strong>${title}</strong><br>`;
    }
    
    items.forEach(item => {
        const value = formatValue(data[item.key]);
        html += `${item.label}: ${value}<br>`;
    });
    
    return html.trim();
}

/**
 * Create standard data tooltip
 * @param {Object} data - Data point
 * @returns {string} HTML string
 */
export function createStandardTooltip(data) {
    const parts = [];
    
    if (data.jurisdiction) {
        parts.push(`<strong>${data.jurisdiction}</strong>`);
    }
    
    if (data.year) {
        parts.push(`Year: ${data.year}`);
    }
    
    if (data.ageGroup) {
        parts.push(`Age: ${data.ageGroup}`);
    }
    
    if (data.location && data.location !== 'General') {
        parts.push(`Location: ${data.location}`);
    }
    
    if (data.detectionMethod) {
        parts.push(`Method: ${data.detectionMethod}`);
    }
    
    if (data.fines !== undefined) {
        parts.push(`Fines: ${formatNumber(data.fines)}`);
    }
    
    if (data.charges !== undefined && data.charges > 0) {
        parts.push(`Charges: ${formatNumber(data.charges)}`);
    }
    
    if (data.arrests !== undefined && data.arrests > 0) {
        parts.push(`Arrests: ${formatNumber(data.arrests)}`);
    }
    
    return parts.join('<br>');
}

/**
 * Helper function to format numbers
 * @param {number} num - Number to format
 * @returns {string} Formatted string
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
}

/**
 * Destroy tooltip (cleanup)
 */
export function destroyTooltip() {
    if (tooltip) {
        tooltip.remove();
        tooltip = null;
    }
}
