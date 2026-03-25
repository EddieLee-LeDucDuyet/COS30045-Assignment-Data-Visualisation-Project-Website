/* ===========================================================
   Header Statistics Update
   =========================================================== */

// ── HEADER STATS ────────────────────────────────────────────
function updateHeaderStats() {
  const totalFines = yearlyData.reduce((s, d) => s + d.fines, 0);
  const peakYear = yearlyData.reduce((max, d) => d.fines > max.fines ? d : max, { year: 0, fines: 0 });
  
  const cameraFines = detectionData
    .filter(d => d.group === 'Camera')
    .reduce((s, d) => s + d.fines, 0);
  const cameraPct = totalFines > 0 ? (cameraFines / totalFines) * 100 : 0;
  
  document.getElementById('total-fines').textContent = fmt(totalFines);
  document.getElementById('peak-year').textContent = peakYear.year;
  document.getElementById('camera-pct').textContent = fmtPct(cameraPct);
}