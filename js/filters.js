/* ===========================================================
   Filter Functionality
   =========================================================== */

// ── FILTER STATE ────────────────────────────────────────────
let activeFilters = {
  yearMin: 2008,
  yearMax: 2024,
  states: [],
  ages: [],
  detection: []
};

// ── INITIALIZE FILTER UI ────────────────────────────────────
function initializeFilters() {
  // Populate year dropdowns
  const yearMin = document.getElementById('filter-year-min');
  const yearMax = document.getElementById('filter-year-max');
  
  for (let year = 2008; year <= 2024; year++) {
    if (year > 2008) {
      const optMin = document.createElement('option');
      optMin.value = year;
      optMin.textContent = year;
      yearMin.appendChild(optMin);
    }
    if (year < 2024) {
      const optMax = document.createElement('option');
      optMax.value = year;
      optMax.textContent = year;
      yearMax.appendChild(optMax);
    }
  }
  yearMax.value = 2024;
  
  // Populate state checkboxes
  const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
  const statesContainer = document.getElementById('filter-states');
  states.forEach(state => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = state;
    checkbox.className = 'filter-state-cb';
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' ' + state));
    statesContainer.appendChild(label);
  });
  
  // Populate age group checkboxes
  const ages = ['0-16', '17-25', '26-39', '40-64', '65 and over', 'Unknown'];
  const agesContainer = document.getElementById('filter-ages');
  ages.forEach(age => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = age;
    checkbox.className = 'filter-age-cb';
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' ' + (age === '65 and over' ? '65+' : age)));
    agesContainer.appendChild(label);
  });
  
  // Populate detection method checkboxes
  const detection = ['Camera', 'Police', 'Unknown'];
  const detectionContainer = document.getElementById('filter-detection');
  detection.forEach(method => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = method;
    checkbox.className = 'filter-detection-cb';
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' ' + method));
    detectionContainer.appendChild(label);
  });
  
  // Handle "All" checkboxes
  setupAllCheckbox('filter-states', 'filter-state-cb');
  setupAllCheckbox('filter-ages', 'filter-age-cb');
  setupAllCheckbox('filter-detection', 'filter-detection-cb');
  
  // Event listeners
  document.getElementById('apply-filters').addEventListener('click', applyFilters);
  document.getElementById('reset-filters').addEventListener('click', resetFilters);
}

function setupAllCheckbox(containerId, className) {
  const container = document.getElementById(containerId);
  const allCheckbox = container.querySelector('input[value="all"]');
  const itemCheckboxes = container.querySelectorAll('.' + className);
  
  allCheckbox.addEventListener('change', function() {
    itemCheckboxes.forEach(cb => cb.checked = this.checked);
  });
  
  itemCheckboxes.forEach(cb => {
    cb.addEventListener('change', function() {
      const allChecked = Array.from(itemCheckboxes).every(checkbox => checkbox.checked);
      allCheckbox.checked = allChecked;
    });
  });
}

// ── APPLY FILTERS ───────────────────────────────────────────
function applyFilters() {
  // Get year range
  activeFilters.yearMin = parseInt(document.getElementById('filter-year-min').value);
  activeFilters.yearMax = parseInt(document.getElementById('filter-year-max').value);
  
  // Get selected states
  const stateCheckboxes = document.querySelectorAll('.filter-state-cb:checked');
  activeFilters.states = Array.from(stateCheckboxes).map(cb => cb.value);
  
  // Get selected ages
  const ageCheckboxes = document.querySelectorAll('.filter-age-cb:checked');
  activeFilters.ages = Array.from(ageCheckboxes).map(cb => cb.value);
  
  // Get selected detection methods
  const detectionCheckboxes = document.querySelectorAll('.filter-detection-cb:checked');
  activeFilters.detection = Array.from(detectionCheckboxes).map(cb => cb.value);
  
  // Reprocess data with filters
  processData();
  updateHeaderStats();
  
  // Redraw active tab
  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab) {
    const drawMap = {
      overview: drawOverview,
      timeline: drawTimeline,
      detection: drawDetection,
      demographics: drawDemographics,
      geography: drawGeography
    };
    drawMap[activeTab.dataset.tab]?.();
  }
}

// ── RESET FILTERS ───────────────────────────────────────────
function resetFilters() {
  document.getElementById('filter-year-min').value = 2008;
  document.getElementById('filter-year-max').value = 2024;
  
  document.querySelectorAll('input[value="all"]').forEach(cb => cb.checked = true);
  document.querySelectorAll('.filter-state-cb, .filter-age-cb, .filter-detection-cb')
    .forEach(cb => cb.checked = true);
  
  applyFilters();
}

// ── FILTER DATA FUNCTION ────────────────────────────────────
function getFilteredData() {
  return rawData.filter(d => {
    // Year filter
    if (d.YEAR < activeFilters.yearMin || d.YEAR > activeFilters.yearMax) {
      return false;
    }
    
    // State filter (if any selected)
    if (activeFilters.states.length > 0 && !activeFilters.states.includes(d.JURISDICTION)) {
      return false;
    }
    
    // Age filter (if any selected)
    if (activeFilters.ages.length > 0) {
      const age = d.AGE_GROUP || 'Unknown';
      if (!activeFilters.ages.includes(age)) {
        return false;
      }
    }
    
    // Detection filter (if any selected)
    if (activeFilters.detection.length > 0) {
      const detection = d.DETECTION_GROUP || 'Unknown';
      if (!activeFilters.detection.includes(detection)) {
        return false;
      }
    }
    
    return true;
  });
}