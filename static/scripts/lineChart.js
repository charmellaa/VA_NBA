const margin = { top: 20, right: 30, bottom: 50, left: 50 };
const width = 465 - margin.left - margin.right;
const height = 315 - margin.top - margin.bottom;

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

  const minPIE = d3.min(data, d => d.PIE); // minimum PIE value 
  const maxPIE = d3.max(data, d => d.PIE); // maximum PIE value
    
  const yScale = d3
    .scaleLinear()
    .domain([Math.max(0, minPIE - 5), maxPIE + 5])
    .range([height, 0]);

  const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
  const yAxis = d3.axisLeft(yScale);

  const line = d3
    .line()
    .x(d => xScale(d.Season))
    .y(d => yScale(d.PIE));

  const drawAxes = () => {
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
   };

    svg.selectAll("*").on('click', function () {
      if (tooltipGroup) {
        tooltipGroup.remove();
        tooltipGroup = null;
      }
    });


  const drawLegend = () => {
    // Create the legend
    const legendData = [
      { label: 'Growth', color: 'green' },
      { label: 'Decline', color: 'red' },
      {label: 'Stable', color: 'blue' },
      { label: 'Volatile', color: 'orange' }
    ];

    const legend = svg.append('g')
      .attr('transform', `translate(${width + margin.right - 120}, 20)`);

    // circle for each legend item
    legendData.forEach((item, index) => {
      const legendItem = legend.append('g')
            .attr('transform', `translate(0, ${index * 25})`);

      legendItem.append('circle')
        .attr('cx', 10)
        .attr('cy', -32)
        .attr('r', 5)
        .attr('fill', item.color);

      legendItem.append('text')
        .attr('x', 30)  
        .attr('y', -30)  
        .text(item.label)
        .style('font-size', '11px')
        .style('fill', 'black');
    });
  }



  // Function to update the chart with new trends
  function updateChart() {
    svg.selectAll("*").remove(); // Clear the previous chart
    
    // Draw axes and labels and legend
    drawAxes();
    drawLegend();

    // Get threshold values
    const growthThreshold = parseFloat(document.getElementById('growth-threshold').value);
    const volatilityThreshold = parseFloat(document.getElementById('volatility-threshold').value);


    players.forEach(player => {
      const playerData = data.filter(d => d.Player === player);

      // Fetch trend analysis for each player
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
                lineColor = 'orange ';
                break;
              default:
                lineColor = 'gray';
            }

            // Draw the line with the determined color
            const path = svg
              .append('path')
              .datum(playerData)
              .attr('fill', 'none')
              .attr('stroke', lineColor)
              .attr('stroke-width', 2)
              .attr('d', line);

            // Click event for each player line
            path.on('click', function (event, d) {
              const playerName = d[0].Player;

              // Remove existing tooltip 
              if (tooltipGroup) tooltipGroup.remove();

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
                    // Tooltip with player's values shown on line click
                    tooltipGroup = svg.append('g')
                      .attr('class', 'tooltip-group')
                      .attr('transform', `translate(${event.offsetX}, ${event.offsetY})`);

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
                      .style('pointer-events', 'none');

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

  updateChart();

  //Event listeners for threshold input
  document.getElementById('growth-threshold').addEventListener('input', updateChart);
  document.getElementById('volatility-threshold').addEventListener('input', updateChart);


});
