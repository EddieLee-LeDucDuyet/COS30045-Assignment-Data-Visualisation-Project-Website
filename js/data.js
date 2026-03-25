/* ===========================================================
   Data Loading & Processing
   =========================================================== */

// ── DATA LOADING & PROCESSING ───────────────────────────────
async function loadData() {
  const csv = await d3.csv('data/cleaned_dataset(mobile).csv', d3.autoType);
  
  rawData = csv.filter(d => 
    d.YEAR && d.FINES != null && d.JURISDICTION
  );
  
  processData();
}

function processData() {
  // Get filtered data (or all data if no filters active)
  const dataToProcess = (typeof getFilteredData === 'function') ? getFilteredData() : rawData;
  
  // Yearly aggregation
  const yearMap = new Map();
  dataToProcess.forEach(d => {
    const key = d.YEAR;
    if (!yearMap.has(key)) {
      yearMap.set(key, { year: key, fines: 0, arrests: 0, charges: 0 });
    }
    const agg = yearMap.get(key);
    agg.fines += d.FINES || 0;
    agg.arrests += d.ARRESTS || 0;
    agg.charges += d.CHARGES || 0;
  });
  yearlyData = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  
  // Detection group aggregation
  const detMap = new Map();
  dataToProcess.forEach(d => {
    const group = d.DETECTION_GROUP || 'Unknown';
    const key = `${d.YEAR}_${group}`;
    if (!detMap.has(key)) {
      detMap.set(key, { year: d.YEAR, group, fines: 0 });
    }
    detMap.get(key).fines += d.FINES || 0;
  });
  detectionData = Array.from(detMap.values());
  
  // Age group aggregation
  const ageMap = new Map();
  dataToProcess.forEach(d => {
    const age = d.AGE_GROUP || 'Unknown';
    if (!ageMap.has(age)) {
      ageMap.set(age, { age, fines: 0 });
    }
    ageMap.get(age).fines += d.FINES || 0;
  });
  ageData = Array.from(ageMap.values())
    .sort((a, b) => b.fines - a.fines);
  
  // Location aggregation
  const locMap = new Map();
  dataToProcess.forEach(d => {
    const loc = d.LOCATION || 'Unknown';
    if (!locMap.has(loc)) {
      locMap.set(loc, { location: loc, fines: 0 });
    }
    locMap.get(loc).fines += d.FINES || 0;
  });
  locationData = Array.from(locMap.values())
    .sort((a, b) => b.fines - a.fines);
  
  // State aggregation
  const stateMap = new Map();
  dataToProcess.forEach(d => {
    const state = d.JURISDICTION;
    const key = `${state}_${d.YEAR}`;
    if (!stateMap.has(key)) {
      stateMap.set(key, { state, year: d.YEAR, fines: 0 });
    }
    stateMap.get(key).fines += d.FINES || 0;
  });
  stateData = Array.from(stateMap.values());
}