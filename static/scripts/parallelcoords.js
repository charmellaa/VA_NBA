document.addEventListener("DOMContentLoaded", () => {
    // Data file path
    const dataFilePath = "/data/full_nba_data_parallel.csv";
  
    // Color mapping for positions
    const positionColors = {
      "Guard": "#7b3294",
      "Center-Forward": "#e6c600",
      "Forward": "#6aab01",
      "Forward-Center": "#0571b0",
      "Forward-Guard": "#008080",
      "Guard-Forward": "#d01c8b",
      "Center": "#e66101"
    };
  
    // Load data
    d3.csv(dataFilePath).then(data => {
      // Parse numerical columns and define the axes
      const axes = ["Team", "Age", "Height_inches", "Weight_lbs", "FG%", "3P%", "FT%", "FGA", "3PA", "FTA"];
  
      // Select the container and dynamically set dimensions
      const container = d3.select(".parallel-coordinates");
      const containerWidth = container.node().clientWidth;
      const containerHeight = container.node().clientHeight;
  
      const margin = { top: 30, right: 30, bottom: 30, left: 40 };
      const width = containerWidth - margin.left - margin.right;
      const height = containerHeight - margin.top - margin.bottom;
  
      const svg = container
        .select("svg#parallel-coordinates-svg")
        .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
  
      const chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      // Scales for each axis
      const yScales = {};
      axes.forEach(axis => {
        if (isNaN(data[0][axis])) {
          // Categorical scale
          const uniqueValues = [...new Set(data.map(d => d[axis]))];
          yScales[axis] = d3.scalePoint()
            .domain(uniqueValues)
            .range([height, 0]);
        } else {
          // Numerical scale
          const minValue = d3.min(data, d => +d[axis]);
          const maxValue = d3.max(data, d => +d[axis]);
          yScales[axis] = d3.scaleLinear()
            .domain([minValue, maxValue])
            .range([height, 0]);
        }
      });
  
      // X scale
      const xScale = d3.scalePoint()
        .domain(axes)
        .range([0, width]);
  
      // Add axes to the chart
      axes.forEach(axis => {
        const axisGroup = chartGroup.append("g")
          .attr("transform", `translate(${xScale(axis)},0)`);
  
        const axisGenerator = isNaN(data[0][axis])
          ? d3.axisLeft(yScales[axis])
          : d3.axisLeft(yScales[axis]).ticks(5);
  
        axisGroup.call(axisGenerator);
        axisGroup.append("text")
          .attr("y", -10)
          .attr("text-anchor", "middle")
          .attr("fill", "black")
          .text(axis);
      });
  
      // Draw lines for each player
      chartGroup.selectAll(".player-line")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "player-line")
        .attr("d", d => {
          return d3.line()(
            axes.map(axis => [xScale(axis), yScales[axis](d[axis])])
          );
        })
        .attr("fill", "none")
        .attr("stroke", d => positionColors[d["Position"]] || "#000")
        .attr("stroke-width", 1)
        .attr("opacity", 0.8)
        .on("mouseover", function () {
          d3.select(this).attr("stroke-width", 2).attr("opacity", 1);
        })
        .on("mouseout", function () {
          d3.select(this).attr("stroke-width", 1).attr("opacity", 0.8);
        });
    }).catch(error => {
      console.error("Error loading data:", error);
    });
  });
  