/* ============================================================
   data.js — Load CSVs, filters, aggregates
   ============================================================ */

let rawData = [];
let trendData = [];
let ageData = [];
let locationData = [];
let jurisData = [];
let breakdownData = [];

/** Sum of fines by DETECTION_GROUP (filtered) — used by Story donut. */
let detectionByGroup = [];

/**
 * filterState keys:
 *  - YEAR: { type: 'range', min, max } | { type: 'pick', set: Set<number> }
 *  - AGE_GROUP: { type: 'range', startIdx, endIdx, order: string[] } | { type: 'pick', set: Set }
 *  - JURISDICTION, LOCATION, METRIC, DETECTION_METHOD, DETECTION_GROUP: Set (partial selection)
 */
let filterState = {};

const DATA_FILES = [
  'cleaned_dataset(no license).csv',
  'cleaned_dataset(mobile).csv',
  'cleaned_dataset(seatbelts).csv',
  'cleaned_dataset(speed).csv'
];

function dataUrl(filename) {
  return 'data/' + encodeURIComponent(filename);
}

function aggregateBy(keyFields, rows) {
  const map = new Map();
  for (const d of rows) {
    const key = keyFields.map(k => d[k]).join('\0');
    if (!map.has(key)) {
      const o = {};
      keyFields.forEach(k => {
        o[k] = d[k];
      });
      o.FINES = 0;
      o.ARRESTS = 0;
      o.CHARGES = 0;
      map.set(key, o);
    }
    const o = map.get(key);
    o.FINES += +d.FINES || 0;
    o.ARRESTS += +d.ARRESTS || 0;
    o.CHARGES += +d.CHARGES || 0;
  }
  return [...map.values()];
}

function filterRows(rows) {
  return rows.filter(row => {
    const y = filterState.YEAR;
    if (y) {
      if (y.type === 'range') {
        if (row.YEAR < y.min || row.YEAR > y.max) return false;
      } else if (y.type === 'pick') {
        if (!y.set.has(row.YEAR)) return false;
      }
    }

    const ag = filterState.AGE_GROUP;
    if (ag) {
      if (ag.type === 'range') {
        const order = ag.order;
        const i = order.indexOf(row.AGE_GROUP);
        if (i === -1) return false;
        if (i < ag.startIdx || i > ag.endIdx) return false;
      } else if (ag.type === 'pick') {
        if (!ag.set.has(row.AGE_GROUP)) return false;
      }
    }

    const catFields = [
      'JURISDICTION',
      'LOCATION',
      'METRIC',
      'DETECTION_METHOD',
      'DETECTION_GROUP'
    ];
    for (const field of catFields) {
      const allowed = filterState[field];
      if (allowed && allowed.size > 0 && !allowed.has(row[field])) return false;
    }

    return true;
  });
}

function rebuildFromFilters() {
  const rows = filterRows(rawData);
  trendData = aggregateBy(['YEAR', 'METRIC'], rows);
  ageData = aggregateBy(['AGE_GROUP', 'METRIC'], rows);
  locationData = aggregateBy(['LOCATION', 'METRIC'], rows);
  jurisData = aggregateBy(['JURISDICTION', 'METRIC'], rows);
  detectionByGroup = aggregateBy(['DETECTION_GROUP'], rows);
  breakdownData = trendData;
}

function getDistinctValues(field) {
  const vals = [...new Set(rawData.map(d => d[field]))].filter(
    v => v != null && v !== ''
  );
  if (field === 'YEAR') return vals.sort((a, b) => a - b);
  return vals.sort((a, b) => String(a).localeCompare(String(b)));
}

/** Ordered age bands for range UI (known order, then any extra labels in data). */
function getAgeGroupOrder() {
  const distinct = getDistinctValues('AGE_GROUP');
  const ordered = [];
  for (const b of AGE_GROUP_ORDER_BASE) {
    if (distinct.includes(b)) ordered.push(b);
  }
  const extra = distinct
    .filter(d => !ordered.includes(d))
    .sort((a, b) => String(a).localeCompare(String(b)));
  return [...ordered, ...extra];
}

function setFilterState(next) {
  filterState = next && typeof next === 'object' ? next : {};
  rebuildFromFilters();
}

function clearAllFilters() {
  filterState = {};
  rebuildFromFilters();
}

function getFilteredRowCount() {
  return filterRows(rawData).length;
}

async function loadData() {
  rawData = (
    await Promise.all(
      DATA_FILES.map(f => d3.csv(dataUrl(f), d3.autoType))
    )
  ).flat();

  filterState = {};
  rebuildFromFilters();
}
