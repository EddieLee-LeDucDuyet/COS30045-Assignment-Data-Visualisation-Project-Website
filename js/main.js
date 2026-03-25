/* ===========================================================
   Tab Navigation & Application Initialization
   =========================================================== */


// ══════════════════════════════════════════════════════════════
// TAB SWITCHING & INITIALIZATION
// ══════════════════════════════════════════════════════════════

function drawOverview() {
  drawOverviewTrend();
  drawOverviewDetection();
  drawOverviewAge();
}

function drawDetection() {
  drawDetectionTimeline();
  drawDetectionState();
}

function drawDemographics() {
  drawDemoAgeBars();
  drawDemoLocation();
}

function drawGeography() {
  drawGeoTotal();
  drawGeoTimeline();
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    
    const drawMap = {
      overview: drawOverview,
      timeline: drawTimeline,
      detection: drawDetection,
      demographics: drawDemographics,
      geography: drawGeography
    };
    drawMap[btn.dataset.tab]?.();
  });
});

// Responsive resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const activeId = document.querySelector('.section.active')?.id;
    const redrawMap = {
      'tab-overview': drawOverview,
      'tab-timeline': drawTimeline,
      'tab-detection': drawDetection,
      'tab-demographics': drawDemographics,
      'tab-geography': drawGeography
    };
    redrawMap[activeId]?.();
  }, 150);
});

// Initialize
async function init() {
  await loadData();
  if (typeof initializeFilters === 'function') {
    initializeFilters();
  }
  updateHeaderStats();
  drawOverview();
}

init();