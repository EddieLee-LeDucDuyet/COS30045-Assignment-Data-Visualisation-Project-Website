/* ===========================================================
   Overview Tab Charts
   =========================================================== */

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