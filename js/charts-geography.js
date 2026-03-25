/* ===========================================================
   Geography Tab Charts
   =========================================================== */

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