const margin = { top: 20, right: 30, bottom: 50, left: 50 };
const width = 500 - margin.left - margin.right;
const height = 340 - margin.top - margin.bottom;

// Append SVG 
const svg = d3
  .select('.line-chart')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

d3.csv('data/top_pies.csv').then(data => {
  const players = Array.from(new Set(data.map(d => d.Player)));
  const seasons = Array.from(new Set(data.map(d => d.Season))).sort(
    (a, b) => a.localeCompare(b)
  );

  data.forEach(d => {
    d.PIE = +d.PIE;
  });

  const xScale = d3
    .scalePoint()
    .domain(seasons)
    .range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, d => d.PIE) + 5])
    .nice()
    .range([height, 0]);

  const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
  const yAxis = d3.axisLeft(yScale);

  svg
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end');

  svg.append('g').call(yAxis);

  svg
    .append('text')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom)
    .attr('text-anchor', 'middle')
    .text('Season')
    .style('font-size', '14px');

  svg
    .append('text')
    .attr('x', -height / 2)
    .attr('y', -margin.left + 15)
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .text('PIE')
    .style('font-size', '14px');

  const line = d3
    .line()
    .x(d => xScale(d.Season))
    .y(d => yScale(d.PIE));

  const colorScale = d3
    .scaleOrdinal(d3.schemeCategory10)
    .domain(players);

  players.forEach(player => {
    const playerData = data.filter(d => d.Player === player);

    svg
      .append('path')
      .datum(playerData)
      .attr('fill', 'none')
      .attr('stroke', colorScale(player))
      .attr('stroke-width', 2)
      .attr('d', line);

    svg
      .append('circle')
      .attr('cx', width - 120)
      .attr('cy', players.indexOf(player) * 20)
      .attr('r', 5)
      .style('fill', colorScale(player));

    svg
      .append('text')
      .attr('x', width -110)
      .attr('y', players.indexOf(player) * 20 + 5)
      .text(player)
      .style('font-size', '12px')
      .style('text-anchor', 'start');
  });
});
