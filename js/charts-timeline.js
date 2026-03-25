/* ===========================================================
   Timeline Tab Chart
   =========================================================== */

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