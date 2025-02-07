document.addEventListener("DOMContentLoaded", () => {
    const dataFilePath = "/data/full_nba_data_parallel.csv";

    const positionColors = {
        "Guard": "#9936ba",
        "Center-Forward": "#bba30a",
        "Forward": "#7ec808",
        "Forward-Center": "#2a00b4",
        "Forward-Guard": "#008029",
        "Guard-Forward": "#ef3eab ",
        "Center": "#da1111"
    };

    let selectedPlayers = [];

    let showPhysicalAttributes = true;


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

    //Physical and shooting metrics
      let allAxes = ["Age", "Height_cm", "Weight_kg", "FG%", "3P%", "FT%", "FGA", "3PA", "FTA"];

      let selectedTeam = "all"; // Keep track of selected team


      

    // console.log("Valid axes:", axes); 
      let axes = [...allAxes];

      // Add a checkbox for toggling physical attributes
      const container = d3.select(".parallel-coordinates");
      const controlsContainer = container.insert("div", "svg#parallel-coordinates-svg")
            .attr("class", "controls-container")
            .style("display", "flex")
            .style("align-items", "center") 
            .style("grid-template-columns", "1fr 1fr")
            .style("gap", "10px")
            .style("font-size", "12px"); 

       
      const teams = [...new Set(data.map(d => d.Team))];

       const dropdown = controlsContainer
       .append("select")
       .attr("id", "team-dropdown")
       .style("grid-column", "1");

      dropdown.append("option")
          .attr("value", "all")
          .text("All Teams")
          .style("font-size", "11px")
       .style("grid-column", "1");


      teams.forEach(teamAbbreviation => {
          dropdown.append("option")
              .attr("value", teamAbbreviation)
              .text(teamNameMap[teamAbbreviation]);
      });

      controlsContainer.append("label")
      .attr("for", "toggle-physical-attributes")
      .text("Show Physical Attributes: ");

     controlsContainer.append("input")
           .attr("type", "checkbox")
           .attr("id", "toggle-physical-attributes")
           .attr("checked", true) // Initially checked 
           .on("change", function () {
               showPhysicalAttributes = this.checked;
               axes = showPhysicalAttributes
                   ? [...allAxes]
                   : allAxes.filter(axis => !["Age", "Height_cm", "Weight_kg"].includes(axis));
               xScale.domain(axes);
               redrawAxesAndLines();
           });

      const containerWidth = container.node().clientWidth;
      const containerHeight = container.node().clientHeight;

      const margin = { top: 30, right: -100, bottom: 30, left: -100 };
      const width = containerWidth - margin.left - margin.right;
      const height = containerHeight - margin.top - margin.bottom;

      const reHighlight = () => {
        const noPlayersSelected = selectedPlayers.length === 0;
        chartGroup.selectAll(".player-line")
          .attr("opacity", d => noPlayersSelected ? 0.8 : (selectedPlayers.includes(d.Player) ? 1 : 0.12)) // Default styling
          .attr("stroke-width", d => noPlayersSelected ? 1 : (selectedPlayers.includes(d.Player) ? 7 : 1)); // Thicker stroke for selected

    }

      const svg = container
        .select("svg#parallel-coordinates-svg")
        .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
       /*.call(
            d3.zoom()
                .scaleExtent([1, 8]) //  zooming 
                .on("zoom", function (event) {
                chartGroup.attr("transform", event.transform);
            })
        );*/

        const chartGroup = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

            // zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 8]) 
            .translateExtent([[0, 0], [width, height]]) 
            .on("zoom", (event) => {
            chartGroup.attr("transform", event.transform);
        });

// Attach the zoom behavior to the svg element
svg.call(zoom);

            const yScales = {};
            const updateYScales = () => {
                axes.forEach(axis => {
                    const minValue = d3.min(data, d => +d[axis]);
                    const maxValue = d3.max(data, d => +d[axis]);
                    yScales[axis] = d3.scaleLinear()
                        .domain([minValue, maxValue])
                        .range([height, 0]);
                });
            };
            updateYScales();

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
                //console.log(selectedPlayers);
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
                       .html(tooltipContent);
            
                const mouseX = event.pageX;
                const mouseY = event.pageY;
            
                const tooltipWidth = tooltip.node().offsetWidth;
                const tooltipHeight = tooltip.node().offsetHeight;
            
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
            
                let x = mouseX + 10;
                let y = mouseY - 20;
            
                if (x + tooltipWidth > windowWidth) {
                    x = mouseX - tooltipWidth - 10;
                }
            
                if (y + tooltipHeight > windowHeight) {
                    y = mouseY - tooltipHeight - 10;
                }
            
                if (y < 0) {
                    y = 10;
                }
            
                tooltip.style("left", `${x}px`).style("top", `${y}px`);
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
          
       
                tooltip.style("display", "none");
            });
            
          };

      

      document.addEventListener("updateSelectedPlayers", (event) => {
        selectedPlayers = event.detail.selectedPlayers;
    
         chartGroup.selectAll(".player-line")
        .attr("opacity", d => selectedPlayers.length === 0 ? 0.8 : (selectedPlayers.includes(d.Player) ? 1 : 0.12)) // Highlight selected players or revert to default
        .attr("stroke-width", d => selectedPlayers.length === 0 ? 1 : (selectedPlayers.includes(d.Player) ? 7 : 1)); // Adjust stroke width accordingly
        });

      dropdown.on("change", function () {
        selectedTeam = this.value; // Update the selected team
        redrawAxesAndLines(); // Redraw with updated team filter

      });

      const redrawAxesAndLines = () => {
        const filteredData = selectedTeam === "all" 
        ? data 
        : data.filter(d => d.Team === selectedTeam); // Filter data based on team
        updateYScales();
    
        chartGroup.selectAll(".axis").remove();
        chartGroup.selectAll(".player-line").remove();
    
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
    
        drawLines(filteredData);
    
        reHighlight();
    };
    // Draw initial lines
    drawLines(data);
  


  }).catch(error => {
      console.error("Error loading data:", error);
  });
});