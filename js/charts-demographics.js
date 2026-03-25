/* ===========================================================
   Demographics Tab Charts
   =========================================================== */

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