document.addEventListener("DOMContentLoaded", () => {
  const dataFilePath = "/data/full_nba_data_parallel.csv";

  const positionColors = {
      "Guard": "#7b3294",
      "Center-Forward": "#e6c600",
      "Forward": "#6aab01",
      "Forward-Center": "#0571b0",
      "Forward-Guard": "#008080",
      "Guard-Forward": "#d01c8b",
      "Center": "#e66101"
  };
  let selectedPlayers = [];

  const teamNameMap = {
      "ATL": "ATL - Atlanta Hawks",
      "BOS": "BOS - Boston Celtics",
      "BKN": "BKN - Brooklyn Nets",
      "CHA": "CHA - Charlotte Hornets",
      "CHI": "CHI - Chicago Bulls",
      "CLE": "CLE - Cleveland Cavaliers",
      "DAL": "DAL - Dallas Mavericks",
      "DEN": "DEN - Denver Nuggets",
      "DET": "DET - Detroit Pistons",
      "GSW": "GSW - Golden State Warriors",
      "HOU": "HOU - Houston Rockets",
      "IND": "IND - Indiana Pacers",
      "LAC": "LAC - Los Angeles Clippers",
      "LAL": "LAL - Los Angeles Lakers",
      "MEM": "MEM - Memphis Grizzlies",
      "MIA": "MIA - Miami Heat",
      "MIL": "MIL - Milwaukee Bucks",
      "MIN": "MIN - Minnesota Timberwolves",
      "NOP": "NOP - New Orleans Pelicans",
      "NYK": "NYK - New York Knicks",
      "OKC": "OKC - Oklahoma City Thunder",
      "ORL": "ORL - Orlando Magic",
      "PHI": "PHI - Philadelphia 76ers",
      "PHX": "PHX - Phoenix Suns",
      "POR": "POR - Portland Trail Blazers",
      "SAC": "SAC - Sacramento Kings",
      "SAS": "SAS - San Antonio Spurs",
      "TOR": "TOR - Toronto Raptors",
      "UTA": "UTA - Utah Jazz",
      "WAS": "WAS - Washington Wizards"
  };

  d3.csv(dataFilePath).then(data => {
      let axes = ["Age", "Height_inches", "Weight_lbs", "FG%", "3P%", "FT%", "FGA", "3PA", "FTA"];

    // console.log("Valid axes:", axes); 

      const teams = [...new Set(data.map(d => d.Team))];

      // dropdown for team selection
      const dropdown = d3.select(".parallel-coordinates")
          .insert("select", "svg#parallel-coordinates-svg")
          .attr("id", "team-dropdown")
          .style("margin-bottom", "10px");

      dropdown.append("option")
          .attr("value", "all")
          .text("All Teams");

      teams.forEach(teamAbbreviation => {
          dropdown.append("option")
              .attr("value", teamAbbreviation)
              .text(teamNameMap[teamAbbreviation]);
      });

      const container = d3.select(".parallel-coordinates");
      const containerWidth = container.node().clientWidth;
      const containerHeight = container.node().clientHeight;

      const margin = { top: 30, right: 5, bottom: 30, left: 5 };
      const width = containerWidth - margin.left - margin.right;
      const height = containerHeight - margin.top - margin.bottom;

      const svg = container
          .select("svg#parallel-coordinates-svg")
          .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
          .attr("preserveAspectRatio", "xMidYMid meet");

      const chartGroup = svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

      const yScales = {};
      axes.forEach(axis => {
          const minValue = d3.min(data, d => +d[axis]);
          const maxValue = d3.max(data, d => +d[axis]);
          yScales[axis] = d3.scaleLinear()
              .domain([minValue, maxValue])
              .range([height, 0]);
      });

      const xScale = d3.scalePoint()
          .domain(axes)
          .range([0, width])
          .padding(0.5);
      
      const tooltip = d3.select("body")
          .append("div")
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.8)")
          .style("color", "#fff")
          .style("padding", "5px")
          .style("border-radius", "5px")
          .style("font-size", "11px")
          .style("display", "none");


          const updateChart = () => {
            // console.log(axes);
            chartGroup.selectAll(".player-line")
                .transition()
                .duration(750)
                .attr("d", d => {
                    return d3.line()(
                        axes.map(axis => {
                            const scale = yScales[axis];
                            return scale ? [xScale(axis), scale(+d[axis])] : [xScale(axis), 0];
                        })
                    );
                });
        };
        
      const dragBehavior = d3.drag()
          .on("start", function (event, axis) {
              d3.select(this).classed("dragging", true);
          })
          .on("drag", function (event, axis) {
              d3.select(this)
                  .attr("transform", `translate(${event.x}, 0)`); 
          })
          .on("end", function (event, axis) {
              d3.select(this).classed("dragging", false);
              // console.log("axis being dragged "+axis);

              // Calculate the new position of the dragged axis
              const oldIndex = axes.indexOf(axis);
              const newIndex = Math.round((event.x - xScale(axis)) / xScale.step() + oldIndex);

              const ind = Math.max(0, Math.min(newIndex, axes.length - 1));

              if (ind !== oldIndex) {
                  axes.splice(oldIndex, 1); // Remove from the old position
                  axes.splice(ind, 0, axis); // Insert at the new position
              }

              // Update xScale with the new order
              xScale.domain(axes);

              // Update axis positions
              chartGroup.selectAll(".axis")
                  .transition()
                  .duration(750)
                  .attr("transform", d => `translate(${xScale(d)}, 0)`);

              // Update the chart to reflect the new axis positions
              updateChart();
          });

      axes.forEach(axis => {
          const axisGroup = chartGroup.append("g")
              .attr("class", "axis")
              .attr("transform", `translate(${xScale(axis)}, 0)`)
              .data([axis])
              .call(dragBehavior);

          axisGroup.append("text")
              .attr("y", -10)
              .attr("text-anchor", "middle")
              .attr("fill", "black")
              .text(axis);

          axisGroup.call(d3.axisLeft(yScales[axis]).ticks(5));
      });

      const drawLines = (filteredData) => {
        // console.log(yScales);
          chartGroup.selectAll(".player-line").remove();

          chartGroup.selectAll(".player-line")
              .data(filteredData)
              .enter()
              .append("path")
              .attr("class", "player-line")
              .attr("d", d => {
                  return d3.line()(
                      axes.map(axis => [xScale(axis), yScales[axis](+d[axis])])
                  );
              })
              .attr("fill", "none")
              .attr("stroke", d => positionColors[d["Position"]] || "#000")
              .attr("stroke-width", 1)
              .attr("opacity", 0.8)
              .on("mouseover", function (event, d) {
                console.log(selectedPlayers);
                // Highlight the selected line
                d3.select(this)
                    .attr("stroke-width", 7)
                    .attr("opacity", 1);
            
                // Dim other lines, except those already highlighted by selection
                chartGroup.selectAll(".player-line")
                    .filter(line => line !== d && !selectedPlayers.includes(line.Player))
                    .attr("opacity", 0.12);
            
                // Show tooltip
                const tooltipContent = `<strong>${d.Player}</strong><br>` +
                    axes.map(axis => `${axis}: ${d[axis]}`).join("<br>");
                tooltip.style("display", "block")
                    .html(tooltipContent)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", function (event, d) {
              // Restore this line's appearance
              d3.select(this)
                  .attr("stroke-width", selectedPlayers.includes(d.Player) ? 7 : 1)
                  .attr("opacity", selectedPlayers.includes(d.Player) ? 1 : 0.12);
          
              // Restore all other lines' appearance
              // Reapply highlighting for selected players
      const noPlayersSelected1 = selectedPlayers.length === 0;
      chartGroup.selectAll(".player-line")
          .attr("opacity", d => noPlayersSelected1 ? 0.8 : (selectedPlayers.includes(d.Player) ? 1 : 0.12)) // Default styling
          .attr("stroke-width", d => noPlayersSelected1 ? 1 : (selectedPlayers.includes(d.Player) ? 7 : 1)); // Thicker stroke for selected
          
              // Hide tooltip
              tooltip.style("display", "none");
          });
          
            
      };

      // Draw initial lines
      drawLines(data);

      document.addEventListener("updateSelectedPlayers", (event) => {
        selectedPlayers = event.detail.selectedPlayers;
    
         chartGroup.selectAll(".player-line")
        .attr("opacity", d => selectedPlayers.length === 0 ? 0.8 : (selectedPlayers.includes(d.Player) ? 1 : 0.12)) // Highlight selected players or revert to default
        .attr("stroke-width", d => selectedPlayers.length === 0 ? 1 : (selectedPlayers.includes(d.Player) ? 7 : 1)); // Adjust stroke width accordingly
    });

    dropdown.on("change", function () {
      const selectedTeam = this.value;
      let filteredData;
  
      if (selectedTeam === "all") {
          filteredData = data; // Use all data if "All Teams" is selected
      } else {
          filteredData = data.filter(d => d.Team === selectedTeam); // Filter by team
      }
  
      drawLines(filteredData); // Redraw lines based on team selection
  
      // Reapply highlighting for selected players
      const noPlayersSelected = selectedPlayers.length === 0;
      chartGroup.selectAll(".player-line")
          .attr("opacity", d => noPlayersSelected ? 0.8 : (selectedPlayers.includes(d.Player) ? 1 : 0.12)) // Default styling
          .attr("stroke-width", d => noPlayersSelected ? 1 : (selectedPlayers.includes(d.Player) ? 7 : 1)); // Thicker stroke for selected
  });
  


  }).catch(error => {
      console.error("Error loading data:", error);
  });
});