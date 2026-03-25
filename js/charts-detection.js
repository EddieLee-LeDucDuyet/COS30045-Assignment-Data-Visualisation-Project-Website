/* ===========================================================
   Detection Methods Tab Charts
   =========================================================== */

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