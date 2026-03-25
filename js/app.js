/* ============================================================
   Mobile Phone Enforcement Dashboard
   ============================================================ */

// ── DATA & STATE ────────────────────────────────────────────
let rawData = [];
let yearlyData = [];
let detectionData = [];
let ageData = [];
let locationData = [];
let stateData = [];

// ── COLORS ──────────────────────────────────────────────────
const COLORS = {
  Camera: '#ef4444',
  Police: '#3b82f6',
  Unknown: '#6b7280',
  
  age_0_16: '#8b5cf6',
  age_17_25: '#f59e0b',
  age_26_39: '#ef4444',
  age_40_64: '#3b82f6',
  age_65_over: '#10b981',
  age_unknown: '#6b7280',
  
  NSW: '#ef4444',
  VIC: '#f59e0b',
  QLD: '#3b82f6',
  WA: '#10b981',
  SA: '#8b5cf6',
  ACT: '#ec4899',
  NT: '#f97316',
  TAS: '#06b6d4'
};

// ── NUMBER FORMATTING ───────────────────────────────────────
function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toLocaleString();
}

function fmtFull(n) {
  return n.toLocaleString();
}

function fmtPct(n) {
  return n.toFixed(1) + '%';
}

// ── TOOLTIP ─────────────────────────────────────────────────
const tooltip = d3.select('#tooltip');

function showTooltip(html, e) {
  tooltip.html(html).classed('visible', true)
    .style('left', (e.clientX + 16) + 'px')
    .style('top', (e.clientY - 10) + 'px');
}

function hideTooltip() {
  tooltip.classed('visible', false);
}

function onMouseMove(e) {
  tooltip.style('left', (e.clientX + 16) + 'px')
    .style('top', (e.clientY - 10) + 'px');
}

// ── HELPER FUNCTIONS ────────────────────────────────────────
function svgDims(selector) {
  const el = document.querySelector(selector);
  return {
    w: el.clientWidth || 800,
    h: +el.getAttribute('height')
  };
}

function renderLegend(containerId, items) {
  const lgd = d3.select(containerId).html('');
  items.forEach(item => {
    lgd.append('div').attr('class', 'legend-item')
      .html(`<div class="legend-dot" style="background:${item.color}"></div>${item.label}`);
  });
}

function addGridLines(g, yScale, width, ticks = 5) {
  g.append('g')
    .selectAll('.grid-line')
    .data(yScale.ticks(ticks))
    .enter().append('line')
      .attr('x1', 0).attr('x2', width)
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('stroke', '#1e2540')
      .attr('stroke-dasharray', '3,5')
      .attr('opacity', 0.5);
}

// ── DATA LOADING & PROCESSING ───────────────────────────────
async function loadData() {
  const csv = await d3.csv('data/cleaned_dataset(mobile).csv', d3.autoType);
  
  rawData = csv.filter(d => 
    d.YEAR && d.FINES != null && d.JURISDICTION
  );
  
  processData();
}

function processData() {
  // Yearly aggregation
  const yearMap = new Map();
  rawData.forEach(d => {
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
  rawData.forEach(d => {
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
  rawData.forEach(d => {
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
  rawData.forEach(d => {
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
  rawData.forEach(d => {
    const state = d.JURISDICTION;
    const key = `${state}_${d.YEAR}`;
    if (!stateMap.has(key)) {
      stateMap.set(key, { state, year: d.YEAR, fines: 0 });
    }
    stateMap.get(key).fines += d.FINES || 0;
  });
  stateData = Array.from(stateMap.values());
}

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

// ══════════════════════════════════════════════════════════════
// OVERVIEW CHARTS
// ══════════════════════════════════════════════════════════════

function drawOverviewTrend() {
  const { w, h } = svgDims('#overview-trend');
  const margin = { top: 20, right: 30, bottom: 40, left: 75 };
  const W = w - margin.left - margin.right;
  const H = h - margin.top - margin.bottom;
  
  const svg = d3.select('#overview-trend');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
  const x = d3.scaleLinear()
    .domain(d3.extent(yearlyData, d => d.year))
    .range([0, W]);
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(yearlyData, d => d.fines) * 1.1])
    .range([H, 0]);
  
  addGridLines(g, y, W, 5);
  
  // Axes
  g.append('g').attr('class', 'axis')
    .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8))
    .attr('transform', `translate(0,${H})`);
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(fmt));
  
  // Area
  const area = d3.area()
    .x(d => x(d.year))
    .y0(H)
    .y1(d => y(d.fines))
    .curve(d3.curveMonotoneX);
  
  g.append('path')
    .datum(yearlyData)
    .attr('class', 'area')
    .attr('fill', COLORS.Camera)
    .attr('d', area);
  
  // Line
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.fines))
    .curve(d3.curveMonotoneX);
  
  const path = g.append('path')
    .datum(yearlyData)
    .attr('class', 'line')
    .attr('stroke', COLORS.Camera)
    .attr('d', line);
  
  const len = path.node().getTotalLength();
  path.attr('stroke-dasharray', len).attr('stroke-dashoffset', len)
    .transition().duration(1500).ease(d3.easeCubicInOut)
      .attr('stroke-dashoffset', 0);
  
  // Dots
  g.selectAll('.dot')
    .data(yearlyData).enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.year))
      .attr('cy', d => y(d.fines))
      .attr('r', 4)
      .attr('fill', COLORS.Camera)
      .on('mouseover', (e, d) =>
        showTooltip(`<strong>${d.year}</strong>Fines: ${fmtFull(d.fines)}`, e))
      .on('mousemove', onMouseMove)
      .on('mouseout', hideTooltip);
  
  // COVID annotation
  if (yearlyData.some(d => d.year === 2020)) {
    g.append('line')
      .attr('x1', x(2020)).attr('x2', x(2020))
      .attr('y1', 0).attr('y2', H)
      .attr('stroke', '#c8ff00')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.5);
    
    g.append('text')
      .attr('x', x(2020) + 6).attr('y', 16)
      .attr('fill', '#c8ff00')
      .attr('font-family', 'DM Mono')
      .attr('font-size', 10)
      .attr('opacity', 0.7)
      .text('COVID-19');
  }
}

function drawOverviewDetection() {
  const { w, h } = svgDims('#overview-detection');
  const size = Math.min(w, h) - 40;
  
  // Total by detection group
  const totals = new Map();
  detectionData.forEach(d => {
    totals.set(d.group, (totals.get(d.group) || 0) + d.fines);
  });
  
  const data = Array.from(totals.entries())
    .map(([group, fines]) => ({ group, fines, color: COLORS[group] || '#6b7280' }))
    .sort((a, b) => b.fines - a.fines);
  
  const svg = d3.select('#overview-detection');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${w / 2},${h / 2})`);
  
  const radius = size / 2 * 0.8;
  const pie = d3.pie().value(d => d.fines).sort(null);
  const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius);
  const arcHover = d3.arc().innerRadius(radius * 0.55).outerRadius(radius * 1.06);
  
  const arcs = g.selectAll('.arc')
    .data(pie(data)).enter().append('g').attr('class', 'arc');
  
  arcs.append('path')
    .attr('class', 'arc-path')
    .attr('fill', d => d.data.color)
    .attr('opacity', 0.9)
    .attr('stroke', '#0a0d14')
    .attr('stroke-width', 2)
    .on('mouseover', function(e, d) {
      d3.select(this).attr('d', arcHover);
      showTooltip(`<strong>${d.data.group}</strong>${fmt(d.data.fines)} fines`, e);
    })
    .on('mousemove', onMouseMove)
    .on('mouseout', function() {
      d3.select(this).attr('d', arc);
      hideTooltip();
    })
    .transition().duration(800).ease(d3.easeCubicOut)
      .attrTween('d', function(d) {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return t => arc(i(t));
      });
  
  const total = data.reduce((s, d) => s + d.fines, 0);
  g.append('text').attr('text-anchor', 'middle').attr('dy', '-8')
    .attr('fill', '#e8eaf2').attr('font-family', 'DM Mono')
    .attr('font-size', 22).attr('font-weight', 500)
    .text(fmt(total));
  
  g.append('text').attr('text-anchor', 'middle').attr('dy', '14')
    .attr('fill', '#6b7391').attr('font-family', 'DM Sans')
    .attr('font-size', 10).attr('letter-spacing', '0.1em')
    .text('TOTAL FINES');
  
  renderLegend('#detection-legend', data.map(d => ({ 
    label: d.group, 
    color: d.color 
  })));
}

function drawOverviewAge() {
  const { w, h } = svgDims('#overview-age');
  const margin = { top: 30, right: 20, bottom: 50, left: 75 };
  const W = w - margin.left - margin.right;
  const H = h - margin.top - margin.bottom;
  
  const svg = d3.select('#overview-age');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
  const ageOrder = ['0-16', '17-25', '26-39', '40-64', '65 and over', 'Unknown'];
  const ordered = ageOrder.filter(a => ageData.some(d => d.age === a));
  
  const x = d3.scaleBand().domain(ordered).range([0, W]).padding(0.25);
  const y = d3.scaleLinear()
    .domain([0, 500000])
    .range([H, 0]);
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisBottom(x).tickFormat(d => d === '65 and over' ? '65+' : d))
    .attr('transform', `translate(0,${H})`)
    .selectAll('text')
      .attr('transform', 'rotate(-15)')
      .attr('text-anchor', 'end');
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).tickValues([0, 100000, 200000, 300000, 400000, 500000]).tickFormat(fmt));
  
  const ageColors = {
    '0-16': COLORS.age_0_16,
    '17-25': COLORS.age_17_25,
    '26-39': COLORS.age_26_39,
    '40-64': COLORS.age_40_64,
    '65 and over': COLORS.age_65_over,
    'Unknown': COLORS.age_unknown
  };
  
  g.selectAll('.bar')
    .data(ageData.filter(d => ordered.includes(d.age)))
    .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.age))
      .attr('width', x.bandwidth())
      .attr('rx', 2)
      .attr('fill', d => ageColors[d.age] || '#6b7280')
      .attr('opacity', 0.85)
      .attr('y', H).attr('height', 0)
      .on('mouseover', (e, d) =>
        showTooltip(`<strong>${d.age}</strong>Fines: ${fmtFull(d.fines)}`, e))
      .on('mousemove', onMouseMove)
      .on('mouseout', hideTooltip)
      .transition().duration(700).ease(d3.easeCubicOut)
        .attr('y', d => y(d.fines))
        .attr('height', d => H - y(d.fines));
  
  // Add value labels on top of bars
  g.selectAll('.bar-label')
    .data(ageData.filter(d => ordered.includes(d.age)))
    .enter().append('text')
      .attr('class', 'bar-label')
      .attr('x', d => x(d.age) + x.bandwidth() / 2)
      .attr('y', d => y(d.fines) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e8eaf2')
      .attr('font-family', 'DM Mono')
      .attr('font-size', 11)
      .attr('font-weight', 500)
      .attr('opacity', 0)
      .text(d => fmt(d.fines))
      .transition().duration(700).delay(400)
        .attr('opacity', 1);
  
  renderLegend('#age-legend', ordered.map(age => ({ 
    label: age === '65 and over' ? '65+' : age, 
    color: ageColors[age] 
  })));
}

// ══════════════════════════════════════════════════════════════
// TIMELINE CHART
// ══════════════════════════════════════════════════════════════

function drawTimeline() {
  const { w, h } = svgDims('#timeline-chart');
  const margin = { top: 20, right: 30, bottom: 40, left: 75 };
  const W = w - margin.left - margin.right;
  const H = h - margin.top - margin.bottom;
  
  const svg = d3.select('#timeline-chart');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Stack by detection group
  const years = [...new Set(yearlyData.map(d => d.year))].sort();
  const groups = ['Police', 'Camera', 'Unknown'];
  
  const stackData = years.map(year => {
    const obj = { year };
    groups.forEach(grp => {
      const sum = detectionData
        .filter(d => d.year === year && d.group === grp)
        .reduce((s, d) => s + d.fines, 0);
      obj[grp] = sum;
    });
    return obj;
  });
  
  const stack = d3.stack().keys(groups)(stackData);
  const maxVal = d3.max(stack[stack.length - 1], d => d[1]);
  
  const x = d3.scaleBand().domain(years).range([0, W]).padding(0.2);
  const y = d3.scaleLinear().domain([0, maxVal * 1.1]).range([H, 0]);
  
  addGridLines(g, y, W, 5);
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisBottom(x).tickFormat(d3.format('d')).tickValues(
      years.filter((y, i) => i % 2 === 0)
    ))
    .attr('transform', `translate(0,${H})`);
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(fmt));
  
  stack.forEach((layer, i) => {
    g.selectAll(`.bar-${i}`)
      .data(layer).enter().append('rect')
        .attr('x', d => x(d.data.year))
        .attr('width', x.bandwidth())
        .attr('rx', i === 0 ? 2 : 0)
        .attr('fill', COLORS[groups[i]])
        .attr('opacity', 0.85)
        .attr('y', H).attr('height', 0)
        .on('mouseover', (e, d) => {
          const val = d.data[groups[i]];
          showTooltip(
            `<strong>${d.data.year} · ${groups[i]}</strong>Fines: ${fmtFull(val)}`, e);
        })
        .on('mousemove', onMouseMove)
        .on('mouseout', hideTooltip)
        .transition().duration(700).delay(i * 80).ease(d3.easeCubicOut)
          .attr('y', d => y(d[1]))
          .attr('height', d => y(d[0]) - y(d[1]));
  });
}

// ══════════════════════════════════════════════════════════════
// DETECTION CHARTS
// ══════════════════════════════════════════════════════════════

function drawDetectionTimeline() {
  const { w, h } = svgDims('#detection-timeline');
  const margin = { top: 20, right: 30, bottom: 40, left: 75 };
  const W = w - margin.left - margin.right;
  const H = h - margin.top - margin.bottom;
  
  const svg = d3.select('#detection-timeline');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
  const groups = ['Police', 'Camera', 'Unknown'];
  const years = [...new Set(detectionData.map(d => d.year))].sort();
  
  const x = d3.scaleLinear().domain(d3.extent(years)).range([0, W]);
  const y = d3.scaleLinear()
    .domain([0, d3.max(detectionData, d => d.fines) * 1.1])
    .range([H, 0]);
  
  addGridLines(g, y, W, 5);
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8))
    .attr('transform', `translate(0,${H})`);
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(fmt));
  
  groups.forEach(group => {
    const series = years.map(year => {
      const match = detectionData.find(d => d.year === year && d.group === group);
      return { year, fines: match ? match.fines : 0, group };
    });
    
    if (series.some(d => d.fines > 0)) {
      const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.fines))
        .curve(d3.curveMonotoneX);
      
      g.append('path')
        .datum(series)
        .attr('class', 'line')
        .attr('stroke', COLORS[group])
        .attr('opacity', 0.9)
        .attr('d', line);
      
      g.selectAll(`.dot-${group}`)
        .data(series.filter(d => d.fines > 0))
        .enter().append('circle')
          .attr('cx', d => x(d.year))
          .attr('cy', d => y(d.fines))
          .attr('r', 3)
          .attr('fill', COLORS[group])
          .on('mouseover', (e, d) =>
            showTooltip(`<strong>${d.year} · ${d.group}</strong>Fines: ${fmtFull(d.fines)}`, e))
          .on('mousemove', onMouseMove)
          .on('mouseout', hideTooltip);
    }
  });
  
  renderLegend('#detection-time-legend', groups.map(g => ({ 
    label: g, 
    color: COLORS[g] 
  })));
}

function drawDetectionState() {
  const { w, h } = svgDims('#detection-state');
  const margin = { top: 20, right: 30, bottom: 40, left: 55 };
  const W = w - margin.left - margin.right;
  const H = h - margin.top - margin.bottom;
  
  const svg = d3.select('#detection-state');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
  const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'ACT', 'NT', 'TAS'];
  const groups = ['Police', 'Camera', 'Unknown'];
  
  // Aggregate by state and detection group
  const stateDetMap = new Map();
  rawData.forEach(d => {
    const key = `${d.JURISDICTION}_${d.DETECTION_GROUP || 'Unknown'}`;
    if (!stateDetMap.has(key)) {
      stateDetMap.set(key, { 
        state: d.JURISDICTION, 
        group: d.DETECTION_GROUP || 'Unknown', 
        fines: 0 
      });
    }
    stateDetMap.get(key).fines += d.FINES || 0;
  });
  
  const stackData = states.map(state => {
    const obj = { state };
    groups.forEach(grp => {
      const match = Array.from(stateDetMap.values())
        .find(d => d.state === state && d.group === grp);
      obj[grp] = match ? match.fines : 0;
    });
    return obj;
  }).sort((a, b) => {
    const sumA = groups.reduce((s, g) => s + a[g], 0);
    const sumB = groups.reduce((s, g) => s + b[g], 0);
    return sumB - sumA;
  });
  
  const stack = d3.stack().keys(groups)(stackData);
  const maxVal = d3.max(stack[stack.length - 1], d => d[1]);
  
  const x = d3.scaleBand()
    .domain(stackData.map(d => d.state))
    .range([0, W])
    .padding(0.25);
  const y = d3.scaleLinear().domain([0, maxVal * 1.1]).range([H, 0]);
  
  addGridLines(g, y, W, 5);
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisBottom(x))
    .attr('transform', `translate(0,${H})`);
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(fmt));
  
  stack.forEach((layer, i) => {
    g.selectAll(`.bar-${i}`)
      .data(layer).enter().append('rect')
        .attr('x', d => x(d.data.state))
        .attr('width', x.bandwidth())
        .attr('rx', i === 0 ? 2 : 0)
        .attr('fill', COLORS[groups[i]])
        .attr('opacity', 0.85)
        .attr('y', H).attr('height', 0)
        .on('mouseover', (e, d) => {
          const val = d.data[groups[i]];
          showTooltip(
            `<strong>${d.data.state} · ${groups[i]}</strong>Fines: ${fmtFull(val)}`, e);
        })
        .on('mousemove', onMouseMove)
        .on('mouseout', hideTooltip)
        .transition().duration(700).delay(i * 80).ease(d3.easeCubicOut)
          .attr('y', d => y(d[1]))
          .attr('height', d => y(d[0]) - y(d[1]));
  });
  
  renderLegend('#detection-state-legend', groups.map(g => ({ 
    label: g, 
    color: COLORS[g] 
  })));
}

// ══════════════════════════════════════════════════════════════
// DEMOGRAPHICS CHARTS
// ══════════════════════════════════════════════════════════════

function drawDemoAgeBars() {
  const { w, h } = svgDims('#demo-age-bars');
  const margin = { top: 30, right: 20, bottom: 40, left: 75 };
  const W = w - margin.left - margin.right;
  const H = h - margin.top - margin.bottom;
  
  const svg = d3.select('#demo-age-bars');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
  const ageOrder = ['0-16', '17-25', '26-39', '40-64', '65 and over', 'Unknown'];
  const ordered = ageOrder.filter(a => ageData.some(d => d.age === a));
  
  const x = d3.scaleBand().domain(ordered).range([0, W]).padding(0.3);
  const y = d3.scaleLinear()
    .domain([0, 500000])
    .range([H, 0]);
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisBottom(x).tickFormat(d => d === '65 and over' ? '65+' : d))
    .attr('transform', `translate(0,${H})`);
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).tickValues([0, 100000, 200000, 300000, 400000, 500000]).tickFormat(fmt));
  
  const ageColors = {
    '0-16': COLORS.age_0_16,
    '17-25': COLORS.age_17_25,
    '26-39': COLORS.age_26_39,
    '40-64': COLORS.age_40_64,
    '65 and over': COLORS.age_65_over,
    'Unknown': COLORS.age_unknown
  };
  
  g.selectAll('.bar')
    .data(ageData.filter(d => ordered.includes(d.age)))
    .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.age))
      .attr('width', x.bandwidth())
      .attr('rx', 2)
      .attr('fill', d => ageColors[d.age] || '#6b7280')
      .attr('opacity', 0.85)
      .attr('y', H).attr('height', 0)
      .on('mouseover', (e, d) =>
        showTooltip(`<strong>${d.age}</strong>Fines: ${fmtFull(d.fines)}`, e))
      .on('mousemove', onMouseMove)
      .on('mouseout', hideTooltip)
      .transition().duration(700).ease(d3.easeCubicOut)
        .attr('y', d => y(d.fines))
        .attr('height', d => H - y(d.fines));
  
  // Add value labels on top of bars
  g.selectAll('.bar-label')
    .data(ageData.filter(d => ordered.includes(d.age)))
    .enter().append('text')
      .attr('class', 'bar-label')
      .attr('x', d => x(d.age) + x.bandwidth() / 2)
      .attr('y', d => y(d.fines) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e8eaf2')
      .attr('font-family', 'DM Mono')
      .attr('font-size', 11)
      .attr('font-weight', 500)
      .attr('opacity', 0)
      .text(d => fmt(d.fines))
      .transition().duration(700).delay(400)
        .attr('opacity', 1);
}

function drawDemoLocation() {
  const { w, h } = svgDims('#demo-location');
  const margin = { top: 30, right: 20, bottom: 60, left: 75 };
  const W = w - margin.left - margin.right;
  const H = h - margin.top - margin.bottom;
  
  const svg = d3.select('#demo-location');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Filter out "All regions" (total) and take top locations
  const filteredLocs = locationData.filter(d => d.location !== 'All regions');
  const topLocs = filteredLocs.slice(0, 6);
  
  const x = d3.scaleBand()
    .domain(topLocs.map(d => d.location))
    .range([0, W])
    .padding(0.3);
  
  const y = d3.scaleLinear()
    .domain([0, 600000])
    .range([H, 0]);
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisBottom(x))
    .attr('transform', `translate(0,${H})`)
    .selectAll('text')
      .attr('transform', 'rotate(-25)')
      .attr('text-anchor', 'end')
      .text(d => {
        if (d === 'Major Cities of Australia') return 'Major Cities';
        if (d === 'Inner Regional Australia') return 'Inner Regional';
        if (d === 'Outer Regional Australia') return 'Outer Regional';
        return d;
      });
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).tickValues([0, 100000, 200000, 300000, 400000, 500000, 600000]).tickFormat(fmt));
  
  const locColors = d3.scaleOrdinal(d3.schemeTableau10);
  
  g.selectAll('.bar')
    .data(topLocs).enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.location))
      .attr('width', x.bandwidth())
      .attr('rx', 2)
      .attr('fill', (d, i) => locColors(i))
      .attr('opacity', 0.85)
      .attr('y', H).attr('height', 0)
      .on('mouseover', (e, d) =>
        showTooltip(`<strong>${d.location}</strong>Fines: ${fmtFull(d.fines)}`, e))
      .on('mousemove', onMouseMove)
      .on('mouseout', hideTooltip)
      .transition().duration(700).ease(d3.easeCubicOut)
        .attr('y', d => y(d.fines))
        .attr('height', d => H - y(d.fines));
  
  // Add value labels on top of bars
  g.selectAll('.bar-label')
    .data(topLocs).enter().append('text')
      .attr('class', 'bar-label')
      .attr('x', d => x(d.location) + x.bandwidth() / 2)
      .attr('y', d => y(d.fines) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e8eaf2')
      .attr('font-family', 'DM Mono')
      .attr('font-size', 11)
      .attr('font-weight', 500)
      .attr('opacity', 0)
      .text(d => fmt(d.fines))
      .transition().duration(700).delay(400)
        .attr('opacity', 1);
}

// ══════════════════════════════════════════════════════════════
// GEOGRAPHY CHARTS
// ══════════════════════════════════════════════════════════════

function drawGeoTotal() {
  const { w, h } = svgDims('#geo-total');
  const margin = { top: 10, right: 20, bottom: 40, left: 75 };
  const W = w - margin.left - margin.right;
  const H = h - margin.top - margin.bottom;
  
  const svg = d3.select('#geo-total');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
  const stateMap = new Map();
  stateData.forEach(d => {
    stateMap.set(d.state, (stateMap.get(d.state) || 0) + d.fines);
  });
  
  const data = Array.from(stateMap.entries())
    .map(([state, fines]) => ({ state, fines }))
    .sort((a, b) => b.fines - a.fines);
  
  const x = d3.scaleBand().domain(data.map(d => d.state)).range([0, W]).padding(0.3);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.fines) * 1.1]).range([H, 0]);
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisBottom(x))
    .attr('transform', `translate(0,${H})`);
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(fmt));
  
  g.selectAll('.bar')
    .data(data).enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.state))
      .attr('width', x.bandwidth())
      .attr('rx', 2)
      .attr('fill', d => COLORS[d.state])
      .attr('opacity', 0.85)
      .attr('y', H).attr('height', 0)
      .on('mouseover', (e, d) =>
        showTooltip(`<strong>${d.state}</strong>Fines: ${fmtFull(d.fines)}`, e))
      .on('mousemove', onMouseMove)
      .on('mouseout', hideTooltip)
      .transition().duration(700).ease(d3.easeCubicOut)
        .attr('y', d => y(d.fines))
        .attr('height', d => H - y(d.fines));
  
  // Add value labels on top of bars
  g.selectAll('.bar-label')
    .data(data).enter().append('text')
      .attr('class', 'bar-label')
      .attr('x', d => x(d.state) + x.bandwidth() / 2)
      .attr('y', d => y(d.fines) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', d => COLORS[d.state])
      .attr('font-family', 'DM Mono')
      .attr('font-size', 11)
      .attr('font-weight', 500)
      .attr('opacity', 0)
      .text(d => fmt(d.fines))
      .transition().duration(700).delay(400)
        .attr('opacity', 1);
}

function drawGeoTimeline() {
  const { w, h } = svgDims('#geo-timeline');
  const margin = { top: 20, right: 30, bottom: 40, left: 75 };
  const W = w - margin.left - margin.right;
  const H = h - margin.top - margin.bottom;
  
  const svg = d3.select('#geo-timeline');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
  const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'ACT'];
  const years = [...new Set(stateData.map(d => d.year))].sort();
  
  const x = d3.scaleLinear().domain(d3.extent(years)).range([0, W]);
  const y = d3.scaleLinear()
    .domain([0, d3.max(stateData, d => d.fines) * 1.1])
    .range([H, 0]);
  
  addGridLines(g, y, W, 5);
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8))
    .attr('transform', `translate(0,${H})`);
  
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(fmt));
  
  states.forEach(state => {
    const series = years.map(year => {
      const match = stateData.find(d => d.state === state && d.year === year);
      return { state, year, fines: match ? match.fines : 0 };
    });
    
    if (series.some(d => d.fines > 0)) {
      const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.fines))
        .curve(d3.curveMonotoneX);
      
      g.append('path')
        .datum(series)
        .attr('class', 'line')
        .attr('stroke', COLORS[state])
        .attr('opacity', 0.85)
        .attr('d', line);
      
      g.selectAll(`.dot-${state}`)
        .data(series.filter(d => d.fines > 0))
        .enter().append('circle')
          .attr('cx', d => x(d.year))
          .attr('cy', d => y(d.fines))
          .attr('r', 3)
          .attr('fill', COLORS[state])
          .on('mouseover', (e, d) =>
            showTooltip(`<strong>${d.state} · ${d.year}</strong>Fines: ${fmtFull(d.fines)}`, e))
          .on('mousemove', onMouseMove)
          .on('mouseout', hideTooltip);
    }
  });
  
  renderLegend('#geo-legend', states.map(s => ({ 
    label: s, 
    color: COLORS[s] 
  })));
}

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
  updateHeaderStats();
  drawOverview();
}

init();