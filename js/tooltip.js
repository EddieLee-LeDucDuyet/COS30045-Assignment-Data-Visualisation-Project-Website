/* ============================================================
   tooltip.js — Shared D3 tooltip helpers
   ============================================================ */

const tooltip = d3.select('#tooltip');

/**
 * Show tooltip with HTML content at the current mouse position.
 * @param {string} html   - Inner HTML for the tooltip body
 * @param {MouseEvent} e  - The triggering mouse event
 */
function showTooltip(html, e) {
  tooltip
    .html(html)
    .classed('visible', true)
    .style('left', (e.clientX + 16) + 'px')
    .style('top',  (e.clientY - 10) + 'px');
}

/** Hide the tooltip. */
function hideTooltip() {
  tooltip.classed('visible', false);
}

/** Follow the mouse while tooltip is visible. */
function onMouseMove(e) {
  tooltip
    .style('left', (e.clientX + 16) + 'px')
    .style('top',  (e.clientY - 10) + 'px');
}