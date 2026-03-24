/* ============================================================
   config.js — Shared constants and utility functions
   ============================================================ */

/* ── COLOUR PALETTE ─────────────────────────────────────────── */
const COLORS = {
  speed_fines:          '#ff4c4c',
  mobile_phone_use:     '#f59e0b',
  non_wearing_seatbelts:'#3b82f6',
  unlicensed_driving:   '#10b981'
};

/* ── DISPLAY LABELS ─────────────────────────────────────────── */
const LABELS = {
  speed_fines:          'Speeding',
  mobile_phone_use:     'Mobile Phone',
  non_wearing_seatbelts:'Seatbelts',
  unlicensed_driving:   'Unlicensed'
};

/* ── ORDERED LISTS ──────────────────────────────────────────── */
const JURISDICTIONS = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'ACT', 'NT', 'TAS'];
const METRICS_LIST  = [
  'speed_fines',
  'mobile_phone_use',
  'non_wearing_seatbelts',
  'unlicensed_driving'
];

const AGE_GROUPS = ['0-16', '17-25', '26-39', '40-64', '65 and over'];

/** Default ordering for age-band range filters; extra labels append from data. */
const AGE_GROUP_ORDER_BASE = [
  '0-16',
  '17-25',
  '26-39',
  '40-64',
  '65 and over',
  'Unknown'
];

const LOCATION_GROUPS = [
  'Major Cities of Australia',
  'Inner Regional Australia',
  'Outer Regional Australia',
  'Remote Australia',
  'Very Remote Australia'
];

/* Short labels for axis tick display */
const LOCATION_SHORT = {
  'Major Cities of Australia':  'Major Cities',
  'Inner Regional Australia':   'Inner Regional',
  'Outer Regional Australia':   'Outer Regional',
  'Remote Australia':           'Remote',
  'Very Remote Australia':      'Very Remote'
};

/* Filter panel labels (dimension keys) */
const FILTER_LABELS = {
  YEAR: 'Year',
  JURISDICTION: 'Jurisdiction',
  LOCATION: 'Location',
  AGE_GROUP: 'Age group',
  METRIC: 'Offence type',
  DETECTION_METHOD: 'Detection method',
  DETECTION_GROUP: 'Detection group'
};

/* ── NUMBER FORMATTERS ──────────────────────────────────────── */

/** Compact format: 1.2M, 340K, 999 */
function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toLocaleString();
}

/** Full locale-formatted number with commas */
function fmtFull(n) {
  return n.toLocaleString();
}