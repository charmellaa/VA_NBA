const margin = { top: 20, right: 30, bottom: 50, left: 50 };
const width = 465 - margin.left - margin.right;
const height = 330 - margin.top - margin.bottom;

// Append SVG 
const svg = d3
  .select('.line-chart')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

let tooltipGroup;
svg.on('click', function () {
  if (tooltipGroup) {
    tooltipGroup.remove();
    tooltipGroup = null;
  }
});

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

  const minPIE = d3.min(data, d => d.PIE); // Find the minimum PIE value in the data
  const maxPIE = d3.max(data, d => d.PIE); // Find the maximum PIE value in the data
    
  const yScale = d3
    .scaleLinear()
    .domain([Math.max(0, minPIE - 5), maxPIE + 5]) // Adjust the domain to start slightly below the minPIE
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

  // Hide tooltip on clicking outside
  svg.on('click', function () {
    if (tooltipGroup) {
      tooltipGroup.remove();
      tooltipGroup = null;
    }
  });

  const line = d3
    .line()
    .x(d => xScale(d.Season))
    .y(d => yScale(d.PIE));

    // Create the legend
const legendData = [
  { label: 'Growth', color: 'green' },
  { label: 'Decline', color: 'red' },
  { label: 'Stable', color: 'blue' },
  { label: 'Volatile', color: 'lavender' }
];

  // Function to update the chart with new trends
  function updateChart() {
    svg.selectAll("*").remove(); // Clear the previous chart
    
    // Recreate axes and labels
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

    // Create a group for the legend
const legend = svg.append('g')
.attr('transform', `translate(${width + margin.right - 120}, 20)`);

// Create a circle for each legend item
legendData.forEach((item, index) => {
const legendItem = legend.append('g')
  .attr('transform', `translate(0, ${index * 25})`);

// Circle for the color
legendItem.append('circle')
  .attr('cx', 10)  // X position for the circle
  .attr('cy', 10)  // Y position for the circle
  .attr('r', 8)    // Radius of the circle
  .attr('fill', item.color);

// Text for the label
legendItem.append('text')
  .attr('x', 30)  // X position for the text
  .attr('y', 15)  // Y position for the text
  .text(item.label)
  .style('font-size', '12px')
  .style('fill', 'black');
});

    players.forEach(player => {
      const playerData = data.filter(d => d.Player === player);

      // Fetch trend analysis for each player
      const growthThreshold = parseFloat(document.getElementById('growth-threshold').value);
      const volatilityThreshold = parseFloat(document.getElementById('volatility-threshold').value);

      fetch('/analyze_trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: player,
          growthThreshold: growthThreshold,
          volatilityThreshold: volatilityThreshold
        })
      })
        .then(response => response.json())
        .then(trendData => {
          if (trendData.error) {
            console.error('Error analyzing trend:', trendData.error);
          } else {
            const trend = trendData.trend;
            let lineColor;

            // Set the color based on the trend
            switch (trend) {
              case 'Growth':
                lineColor = 'green';
                break;
              case 'Decline':
                lineColor = 'red';
                break;
              case 'Stable':
                lineColor = 'blue';
                break;
              case 'Volatile':
                lineColor = 'lavender';
                break;
              default:
                lineColor = 'gray'; // Default color in case trend is unknown
            }

            // Draw the line with the determined color
            const path = svg
              .append('path')
              .datum(playerData)
              .attr('fill', 'none')
              .attr('stroke', lineColor)
              .attr('stroke-width', 2)
              .attr('d', line);

            // Add click event for each player line
            path.on('click', function (event, d) {
              const playerName = d[0].Player;

              // Remove existing tooltip if any
              if (tooltipGroup) tooltipGroup.remove();

              // Fetch analysis data
              fetch('/analyze_trends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  playerName,
                  growthThreshold,
                  volatilityThreshold
                })
              })
                .then(response => response.json())
                .then(data => {
                  if (data.error) {
                    alert(data.error);
                  } else {
                    // Create a tooltip group
                    tooltipGroup = svg.append('g')
                      .attr('class', 'tooltip-group')
                      .attr('transform', `translate(${event.offsetX}, ${event.offsetY})`);

                    // Tooltip rectangle
                    tooltipGroup.append('rect')
                      .attr('width', 200)
                      .attr('height', 100)
                      .attr('x', 10)
                      .attr('y', -10)
                      .attr('rx', 5)
                      .attr('ry', 5)
                      .attr('fill', 'white')
                      .attr('stroke', 'black')
                      .attr('stroke-width', 1)
                      .style('pointer-events', 'none'); // Prevent interaction with tooltip

                    // Tooltip text
                    const text = tooltipGroup.append('text')
                      .attr('x', 20)
                      .attr('y', 10)
                      .style('font-size', '12px')
                      .style('fill', 'black');

                    text.append('tspan')
                      .text(`${playerName}`)
                      .style('font-weight', 'bold')
                      .attr('x', 20)
                      .attr('dy', '1.2em');
                    text.append('tspan')
                      .text(`${data.trend}`)
                      .style('font-weight', 'bold')
                      .attr('x', 20)
                      .attr('dy', '1.2em');
                    text.append('tspan')
                      .text(`Growth Rate: ${data.avg_growth_rate.toFixed(2)}%`)
                      .attr('x', 20)
                      .attr('dy', '1.2em');
                    text.append('tspan')
                      .text(`Volatility: ${data.std_dev.toFixed(2)}`)
                      .attr('x', 20)
                      .attr('dy', '1.2em');
                  }
                })
                .catch(error => console.error('Error:', error));
            });
          }
        })
        .catch(error => console.error('Error analyzing trends for player:', error));
    });
  }

  // Initialize the chart
  updateChart();

  // Add event listeners to the threshold controls
  document.getElementById('growth-threshold').addEventListener('input', updateChart);
  document.getElementById('volatility-threshold').addEventListener('input', updateChart);


});
