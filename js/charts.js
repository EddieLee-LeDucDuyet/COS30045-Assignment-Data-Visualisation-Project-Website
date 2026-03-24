/* ============================================================
   charts.js — All D3 chart rendering functions
   Depends on: d3, config.js, tooltip.js, data.js
   ============================================================ */

/* ── HELPER ─────────────────────────────────────────────────── */

/** Return the rendered pixel dimensions of an SVG element. */
function svgDims(selector) {
  const el = document.querySelector(selector);
  return {
    w: el.clientWidth || 800,
    h: +el.getAttribute('height')
  };
}

/** Render a colour-keyed legend into a container element. */
function renderLegend(containerId, metrics) {
  const lgd = d3.select(containerId).html('');
  metrics.forEach(m => {
    lgd.append('div')
      .attr('class', 'legend-item')
      .html(`<div class="legend-dot" style="background:${COLORS[m]}"></div>${LABELS[m]}`);
  });
}

/** Add horizontal grid lines to a chart group. */
function addGridLines(g, yScale, width, ticks = 5) {
  g.append('g')
    .selectAll('.grid-line')
    .data(yScale.ticks(ticks))
    .enter().append('line')
      .attr('x1', 0).attr('x2', width)
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('stroke', '#1e2540')
      .attr('stroke-dasharray', '3,5');
}


/* ════════════════════════════════════════════════════════════
   STORY CHARTS
   ════════════════════════════════════════════════════════════ */

/** Horizontal bar chart — total fines by offence type. */
function drawStoryBar() {
  const { w, h } = svgDims('#story-bar');
  const margin = { top: 10, right: 20, bottom: 30, left: 80 };
  const W = w - margin.left - margin.right;
  const H = h - margin.top - margin.bottom;

  const totals = METRICS_LIST
    .map(m => ({
      metric: m,
      value:  trendData.filter(d => d.METRIC === m).reduce((s, d) => s + d.FINES, 0)
    }))
    .sort((a, b) => b.value - a.value);

  const maxBar = Math.max(d3.max(totals, d => d.value) || 0, 1);

  const svg = d3.select('#story-bar');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, maxBar]).range([0, W]);
  const y = d3.scaleBand().domain(totals.map(d => d.metric)).range([0, H]).padding(0.3);

  g.append('g').attr('class', 'axis')
    .call(d3.axisBottom(x).ticks(4).tickFormat(fmt))
    .attr('transform', `translate(0,${H})`);

  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).tickFormat(d => LABELS[d]));

  g.selectAll('.bar')
    .data(totals).enter().append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => y(d.metric))
      .attr('height', y.bandwidth())
      .attr('rx', 2)
      .attr('fill', d => COLORS[d.metric])
      .attr('width', 0)
      .on('mouseover', (e, d) =>
        showTooltip(`<strong>${LABELS[d.metric]}</strong>Total fines: ${fmtFull(d.value)}`, e))
      .on('mousemove', onMouseMove)
      .on('mouseout', hideTooltip)
      .transition().duration(800).ease(d3.easeCubicOut)
        .attr('width', d => x(d.value));

  g.selectAll('.bar-label')
    .data(totals).enter().append('text')
      .attr('x', d => x(d.value) + 6)
      .attr('y', d => y(d.metric) + y.bandwidth() / 2 + 4)
      .attr('fill', d => COLORS[d.metric])
      .attr('font-family', 'DM Mono')
      .attr('font-size', 11)
      .text(d => fmt(d.value))
      .attr('opacity', 0)
      .transition().duration(800).delay(400)
        .attr('opacity', 1);
}


/** Multi-line trend chart — annual fines for all offences. */
function drawStoryTrend() {
  const { w, h } = svgDims('#story-trend');
  const margin = { top: 20, right: 30, bottom: 36, left: 65 };
  const W = w - margin.left - margin.right;
  const H = h - margin.top - margin.bottom;

  const years = [...new Set(trendData.map(d => d.YEAR))].sort();
  const maxY = d3.max(trendData, d => d.FINES) || 0;

  const svg = d3.select('#story-trend');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(years.length ? d3.extent(years) : [2008, 2024])
    .range([0, W]);
  const y = d3.scaleLinear()
    .domain([0, maxY * 1.1 || 1])
    .range([H, 0]);

  addGridLines(g, y, W, 4);

  g.append('g').attr('class', 'axis')
    .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8))
    .attr('transform', `translate(0,${H})`);

  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(fmt));

  METRICS_LIST.forEach(metric => {
    const series = trendData.filter(d => d.METRIC === metric).sort((a, b) => a.YEAR - b.YEAR);
    if (series.length < 2) return;

    const line = d3.line()
      .x(d => x(d.YEAR))
      .y(d => y(d.FINES))
      .curve(d3.curveMonotoneX);

    const path = g.append('path').datum(series)
      .attr('class', 'line')
      .attr('stroke', COLORS[metric])
      .attr('opacity', 0.85)
      .attr('d', line);

    const len = path.node().getTotalLength();
    path.attr('stroke-dasharray', len).attr('stroke-dashoffset', len)
      .transition().duration(1200).ease(d3.easeCubicInOut)
        .attr('stroke-dashoffset', 0);

    g.selectAll(`.dot-${metric}`)
      .data(series).enter().append('circle')
        .attr('class', `dot dot-${metric}`)
        .attr('cx', d => x(d.YEAR))
        .attr('cy', d => y(d.FINES))
        .attr('r', 3)
        .attr('fill', COLORS[metric])
        .on('mouseover', (e, d) =>
          showTooltip(`<strong>${LABELS[d.METRIC]} · ${d.YEAR}</strong>Fines: ${fmtFull(d.FINES)}`, e))
        .on('mousemove', onMouseMove)
        .on('mouseout', hideTooltip);
  });

  renderLegend('#story-trend-legend',
    METRICS_LIST.filter(m => trendData.some(d => d.METRIC === m)));
}


/** Donut chart — detection group breakdown (from filtered rows). */
function drawStoryDetection() {
  const { w, h } = svgDims('#story-detection');
  const size = Math.min(w, h) - 40;

  const groupColor = {
    Police: '#f59e0b',
    Camera: '#ef4444',
    Unknown: '#6b7280'
  };
  const palette = d3.schemeTableau10;

  const detData = (detectionByGroup || [])
    .filter(d => d.FINES > 0)
    .map((d, i) => ({
      label: d.DETECTION_GROUP,
      value: d.FINES,
      color: groupColor[d.DETECTION_GROUP] || palette[i % palette.length]
    }))
    .sort((a, b) => b.value - a.value);

  const totalFines = d3.sum(detData, d => d.value);

  const svg = d3.select('#story-detection');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${w / 2},${h / 2})`);

  if (!detData.length || !totalFines) {
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7391')
      .attr('font-family', 'DM Sans')
      .attr('font-size', 13)
      .text('No fines in current filter');
    return;
  }

  const radius   = size / 2 * 0.8;
  const pie      = d3.pie().value(d => d.value).sort(null);
  const arc      = d3.arc().innerRadius(radius * 0.55).outerRadius(radius);
  const arcHover = d3.arc().innerRadius(radius * 0.55).outerRadius(radius * 1.06);

  const arcs = g.selectAll('.arc')
    .data(pie(detData)).enter().append('g').attr('class', 'arc');

  arcs.append('path')
    .attr('fill', d => d.data.color)
    .attr('opacity', 0.9)
    .attr('stroke', '#0a0d14')
    .attr('stroke-width', 2)
    .on('mouseover', function(e, d) {
      d3.select(this).attr('d', arcHover);
      showTooltip(`<strong>${d.data.label}</strong>${fmt(d.data.value)} fines`, e);
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

  g.append('text').attr('text-anchor', 'middle').attr('dy', '-8')
    .attr('fill', '#e8eaf2').attr('font-family', 'DM Mono')
    .attr('font-size', 22).attr('font-weight', 500)
    .text(fmt(totalFines));

  g.append('text').attr('text-anchor', 'middle').attr('dy', '14')
    .attr('fill', '#6b7391').attr('font-family', 'DM Sans')
    .attr('font-size', 10).attr('letter-spacing', '0.1em')
    .text('TOTAL FINES');
}


/** Stacked bar — offence profile across all age groups. */
function drawStoryYouth() {
  const { w, h } = svgDims('#story-youth');
  const margin = { top: 20, right: 20, bottom: 30, left: 80 };
  const W = w - margin.left - margin.right;
  const H = h - margin.top - margin.bottom;

  const svg = d3.select('#story-youth');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Build per-group lookup
  const grouped = {};
  AGE_GROUPS.forEach(gr => {
    grouped[gr] = {};
    METRICS_LIST.forEach(m => {
      const row = ageData.find(d => d.AGE_GROUP === gr && d.METRIC === m);
      grouped[gr][m] = row ? row.FINES : 0;
    });
  });

  const stackInput = AGE_GROUPS.map(gr => ({ group: gr, ...grouped[gr] }));
  const stack = d3.stack().keys(METRICS_LIST)(stackInput);
  const maxVal = d3.max(stack[stack.length - 1], d => d[1]) || 0;

  const x = d3.scaleBand().domain(AGE_GROUPS).range([0, W]).padding(0.25);
  const y = d3.scaleLinear().domain([0, maxVal * 1.1 || 1]).range([H, 0]);

  g.append('g').attr('class', 'axis')
    .call(d3.axisBottom(x).tickFormat(d => d === '65 and over' ? '65+' : d))
    .attr('transform', `translate(0,${H})`);

  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(4).tickFormat(fmt));

  stack.forEach((layer, i) => {
    g.selectAll(`.bar-youth-${i}`)
      .data(layer).enter().append('rect')
        .attr('x', d => x(d.data.group))
        .attr('width', x.bandwidth())
        .attr('rx', 2)
        .attr('fill', COLORS[METRICS_LIST[i]])
        .attr('opacity', 0.85)
        .attr('y', H).attr('height', 0)
        .on('mouseover', (e, d) =>
          showTooltip(
            `<strong>${d.data.group} · ${LABELS[METRICS_LIST[i]]}</strong>` +
            `Fines: ${fmtFull(d.data[METRICS_LIST[i]])}`, e))
        .on('mousemove', onMouseMove)
        .on('mouseout', hideTooltip)
        .transition().duration(800).delay(i * 100).ease(d3.easeCubicOut)
          .attr('y', d => y(d[1]))
          .attr('height', d => y(d[0]) - y(d[1]));
  });
}


/** Render all four story charts. */
function drawStory() {
  drawStoryBar();
  drawStoryTrend();
  drawStoryDetection();
  drawStoryYouth();
}


/* ════════════════════════════════════════════════════════════
   TRENDS CHART
   ════════════════════════════════════════════════════════════ */

let trendMetric  = 'FINES';
let trendOffence = 'all';

function drawTrend() {
  const { w, h } = svgDims('#trend-chart');
  const margin = { top: 20, right: 30, bottom: 40, left: 75 };
  const W = w - margin.left - margin.right;
  const H = h - margin.top - margin.bottom;

  const filtered = trendOffence === 'all'
    ? trendData
    : trendData.filter(d => d.METRIC === trendOffence);

  const years = [...new Set(filtered.map(d => d.YEAR))].sort();
  const maxTrend = d3.max(filtered, d => d[trendMetric]) || 0;

  const svg = d3.select('#trend-chart');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(years.length ? d3.extent(years) : [2008, 2024])
    .range([0, W]);
  const y = d3.scaleLinear()
    .domain([0, maxTrend * 1.15 || 1])
    .range([H, 0]);

  addGridLines(g, y, W, 6);

  g.append('g').attr('class', 'axis')
    .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8))
    .attr('transform', `translate(0,${H})`);

  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(6).tickFormat(fmt));

  const metricsToShow = trendOffence === 'all' ? METRICS_LIST : [trendOffence];

  metricsToShow.forEach(metric => {
    const series = filtered.filter(d => d.METRIC === metric).sort((a, b) => a.YEAR - b.YEAR);
    if (!series.length) return;

    const line = d3.line()
      .x(d => x(d.YEAR))
      .y(d => y(d[trendMetric]))
      .curve(d3.curveMonotoneX);

    const path = g.append('path').datum(series)
      .attr('class', 'line')
      .attr('stroke', COLORS[metric])
      .attr('stroke-width', trendOffence === 'all' ? 2 : 3)
      .attr('opacity', 0.9)
      .attr('d', line);

    const len = path.node().getTotalLength();
    path.attr('stroke-dasharray', len).attr('stroke-dashoffset', len)
      .transition().duration(1000).ease(d3.easeCubicInOut)
        .attr('stroke-dashoffset', 0);

    g.selectAll(`.dot-t-${metric}`)
      .data(series).enter().append('circle')
        .attr('cx', d => x(d.YEAR))
        .attr('cy', d => y(d[trendMetric]))
        .attr('r', 4)
        .attr('fill', COLORS[metric])
        .on('mouseover', (e, d) =>
          showTooltip(
            `<strong>${LABELS[d.METRIC]} · ${d.YEAR}</strong>` +
            `${trendMetric}: ${fmtFull(d[trendMetric])}`, e))
        .on('mousemove', onMouseMove)
        .on('mouseout', hideTooltip);
  });

  // COVID annotation
  if (years.includes(2020) && trendMetric === 'FINES') {
    g.append('line')
      .attr('x1', x(2020)).attr('x2', x(2020))
      .attr('y1', 0).attr('y2', H)
      .attr('stroke', '#c8ff00').attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4').attr('opacity', 0.5);

    g.append('text')
      .attr('x', x(2020) + 6).attr('y', 16)
      .attr('fill', '#c8ff00').attr('font-family', 'DM Mono')
      .attr('font-size', 10).attr('opacity', 0.7)
      .text('COVID-19');
  }

  renderLegend('#trend-legend', metricsToShow);
}


/* ════════════════════════════════════════════════════════════
   BREAKDOWN CHART
   ════════════════════════════════════════════════════════════ */

let bkView   = 'age';
let bkMetric = 'FINES';

function drawBreakdown() {
  const { w, h } = svgDims('#breakdown-chart');
  const margin = {
    top: 20, right: 30, bottom: 40,
    left: bkView === 'location' ? 160 : 75
  };
  const W = w - margin.left - margin.right;
  const H = h - margin.top - margin.bottom;

  const src      = bkView === 'age' ? ageData : locationData;
  const groupKey = bkView === 'age' ? 'AGE_GROUP' : 'LOCATION';
  const groups   = bkView === 'age' ? AGE_GROUPS : LOCATION_GROUPS;

  const svg = d3.select('#breakdown-chart');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x0 = d3.scaleBand().domain(groups).range([0, W]).paddingInner(0.2);
  const x1 = d3.scaleBand().domain(METRICS_LIST).range([0, x0.bandwidth()]).padding(0.06);
  const y  = d3.scaleLinear()
    .domain([0, (d3.max(src, d => d[bkMetric]) || 1) * 1.12])
    .range([H, 0]);

  addGridLines(g, y, W, 5);

  g.append('g').attr('class', 'axis')
    .call(d3.axisBottom(x0).tickFormat(d => {
      if (d === '65 and over') return '65+';
      return LOCATION_SHORT[d] || d;
    }))
    .attr('transform', `translate(0,${H})`);

  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(fmt));

  groups.forEach(gr => {
    const grData = src.filter(d => d[groupKey] === gr);
    METRICS_LIST.forEach(m => {
      const row = grData.find(d => d.METRIC === m);
      const val = row ? row[bkMetric] : 0;

      g.append('rect')
        .attr('x', x0(gr) + x1(m))
        .attr('width', x1.bandwidth())
        .attr('rx', 2)
        .attr('fill', COLORS[m])
        .attr('opacity', 0.85)
        .attr('y', H).attr('height', 0)
        .on('mouseover', e =>
          showTooltip(
            `<strong>${gr}</strong>` +
            `${LABELS[m]}: ${fmtFull(val)} ${bkMetric.toLowerCase()}`, e))
        .on('mousemove', onMouseMove)
        .on('mouseout', hideTooltip)
        .transition().duration(700).ease(d3.easeCubicOut)
          .attr('y', y(val))
          .attr('height', H - y(val));
    });
  });

  renderLegend('#breakdown-legend', METRICS_LIST);
}


/* ════════════════════════════════════════════════════════════
   JURISDICTION CHART
   ════════════════════════════════════════════════════════════ */

let jurMetric = 'FINES';

function drawJurisdiction() {
  const { w, h } = svgDims('#juris-chart');
  const margin = { top: 20, right: 30, bottom: 40, left: 55 };
  const W = w - margin.left - margin.right;
  const H = h - margin.top - margin.bottom;

  const stackData = JURISDICTIONS
    .map(jur => {
      const obj = { jur };
      METRICS_LIST.forEach(m => {
        const row = jurisData.find(d => d.JURISDICTION === jur && d.METRIC === m);
        obj[m] = row ? row[jurMetric] : 0;
      });
      return obj;
    })
    .sort((a, b) => {
      const sumA = METRICS_LIST.reduce((s, m) => s + a[m], 0);
      const sumB = METRICS_LIST.reduce((s, m) => s + b[m], 0);
      return sumB - sumA;
    });

  const stack  = d3.stack().keys(METRICS_LIST)(stackData);
  const maxVal = d3.max(stack[stack.length - 1], d => d[1]);

  const svg = d3.select('#juris-chart');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(stackData.map(d => d.jur)).range([0, W]).padding(0.25);
  const y = d3.scaleLinear().domain([0, maxVal * 1.1]).range([H, 0]);

  addGridLines(g, y, W, 5);

  g.append('g').attr('class', 'axis')
    .call(d3.axisBottom(x))
    .attr('transform', `translate(0,${H})`);

  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(fmt));

  stack.forEach((layer, i) => {
    g.selectAll(`.jbar-${i}`)
      .data(layer).enter().append('rect')
        .attr('x', d => x(d.data.jur))
        .attr('width', x.bandwidth())
        .attr('rx', i === 0 ? 2 : 0)
        .attr('fill', COLORS[METRICS_LIST[i]])
        .attr('opacity', 0.85)
        .attr('y', H).attr('height', 0)
        .on('mouseover', (e, d) => {
          const val = d.data[METRICS_LIST[i]];
          showTooltip(
            `<strong>${d.data.jur} · ${LABELS[METRICS_LIST[i]]}</strong>` +
            `${jurMetric}: ${fmtFull(val)}`, e);
        })
        .on('mousemove', onMouseMove)
        .on('mouseout', hideTooltip)
        .transition().duration(700).delay(i * 80).ease(d3.easeCubicOut)
          .attr('y', d => y(d[1]))
          .attr('height', d => y(d[0]) - y(d[1]));
  });

  renderLegend('#juris-legend', METRICS_LIST);
}