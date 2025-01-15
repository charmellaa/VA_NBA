const selectedPlayers = [];
let fullNbaData = []; // Store data from full_nba_data.csv
let isDefaultCleared = false; // Track if default players are cleared

d3.csv("/data/playerslist.csv").then(playerListData => {
    d3.csv("/data/full_nba_data.csv").then(fullData => {
        fullNbaData = fullData; // Save the full NBA data for radar chart usage

        const playerList = d3.select("#player-list");
        const search = d3.select("#search-bar");
        const noPlayer = d3.select("#no-player-found");
        const deselectButton = d3.select("#deselect-button");
        const radarChartSvg = d3.select("#radar-chart-svg");

        const maxSelections = 3;
        const radarMetrics = ["PTS","REB", "AST", "STL", "BLK", "TOV"];
        const positionColors = {
            "Guard": "#8d108d",
            "Center-Forward": "#0b5cad",
            "Forward": "#eea513",
            "Forward-Center": "#d23a3a",
            "Forward-Guard": "#259e25",
            "Guard-Forward": "#d00a8e",
            "Center": "#026b6b"
        };

        const defaultPlayers = ["LeBron James"]; // Default player(s) for radar chart

        const renderPlayers = (filtered_data) => {
            playerList.html("");

            if (filtered_data.length > 0) {
                noPlayer.style("display", "none");

                playerList.selectAll(".player-entry")
                    .data(filtered_data)
                    .enter()
                    .append("div")
                    .attr("class", "player-entry")
                    .attr("data-player-name", d => d.Player)
                    .style("background-color", d => selectedPlayers.includes(d.Player) ? "#d9f2d9" : "#f5f5f5")
                    .on("click", function (event, d) {
                        const playerName = d.Player;

                        if (!isDefaultCleared) {
                            // Clear default players on first user selection
                            selectedPlayers.length = 0;
                            isDefaultCleared = true;
                        }

                        if (selectedPlayers.includes(playerName)) {
                            selectedPlayers.splice(selectedPlayers.indexOf(playerName), 1);
                            d3.select(this).style("background-color", "#f5f5f5");
                        } else if (selectedPlayers.length < maxSelections) {
                            selectedPlayers.push(playerName);
                            d3.select(this).style("background-color", "#d9f2d9");
                        } else {
                            alert("You can only select up to 3 players.");
                        }

                    // Update scatterplot based on the selection through custom event
                    playerList.dispatch("playerSelectionChange", { detail: { selectedPlayers } });
                    updateDeselectButton();  // Update button state
                    updateRadarChart(); // Update radar chart


                    // console.log(selectedPlayers);
                })
            .html(d => `
                <div class="player-photo">
                <img src="${d.Player_img && d.Player_img !== 'null' ? d.Player_img : 'default.png'}" alt="${d.Player || 'Unknown Player'}" style= "border: 2px solid ${positionColors[d.Position]}">
                </div>
                <div class="player-info">
                <p class="player-name" style="color: ${positionColors[d.Position] || '#ffffff'};">
                ${d.Player || 'No Name Available'}
                </p>
                <p>Team: ${d.Team || 'Unknown Team'}<br>
                Number: ${d.Number || 'N/A'}<br>
                Height: ${d.Height_inches ? d.Height_inches + ' inches' : 'Height not available'}<br>
                Weight: ${d.Weight_lbs ? d.Weight_lbs + ' lbs' : 'Weight not available'}<br>
             </div>`
            );
    } else {
        noPlayer.style("display", "block");
        }
    };

        const updateRadarChart = () => {
            const selectedData = fullNbaData.filter(player => selectedPlayers.includes(player.Player));
            renderRadarChart(selectedData);
        };

        const renderRadarChart = (players) => {
            const width = 400;
            const height = 400;
            const radius = Math.min(width, height) / 2 - 50;

            radarChartSvg.html(""); // Clear the existing chart

            const angleSlice = (2 * Math.PI) / radarMetrics.length;

            const rScale = d3.scaleLinear()
                .domain([0, d3.max(players.map(p => Math.max(...radarMetrics.map(m => +p[m]))))])
                .range([0, radius]);

            const radarLine = d3.lineRadial()
                .radius(d => rScale(d.value))
                .angle((d, i) => i * angleSlice);

            const g = radarChartSvg
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${width / 2}, ${height / 2})`);

            // Draw grid lines
            const levels = 5;
            for (let level = 0; level < levels; level++) {
                const r = (radius / levels) * (level + 1);
                g.append("circle")
                    .attr("r", r)
                    .style("fill", "none")
                    .style("stroke", "lightgray")
                    .style("stroke-dasharray", "3,3");
            }

            // Draw axes
            radarMetrics.forEach((metric, i) => {
                const angle = angleSlice * i - Math.PI / 2;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                g.append("line")
                    .attr("x1", 0)
                    .attr("y1", 0)
                    .attr("x2", x)
                    .attr("y2", y)
                    .style("stroke", "lightgray")
                    .style("stroke-width", 1);

                g.append("text")
                    .attr("x", x * 1.1)
                    .attr("y", y * 1.1)
                    .style("text-anchor", "middle")
                    .text(metric);
            });

            // Draw data
            players.forEach(player => {
                const dataPoints = radarMetrics.map((metric, i) => ({
                    axis: metric,
                    value: +player[metric]
                }));

                g.append("path")
                    .datum(dataPoints)
                    .attr("d", radarLine)
                    .style("fill", positionColors[player.Position])
                    .style("fill-opacity", 0.2)
                    .style("stroke", positionColors[player.Position])
                    .style("stroke-width", 2);
            });
        };

        renderPlayers(playerListData);

        // Initialize with default players
        defaultPlayers.forEach(playerName => {
            const player = playerListData.find(p => p.Player === playerName);
            if (player) selectedPlayers.push(playerName);
        });

        updateRadarChart();

        search.on("input", function () {
            const searchName = this.value.toLowerCase();
            const playerSearch = playerListData.filter(player =>
                player.Player && player.Player.toLowerCase().includes(searchName)
            );

            renderPlayers(playerSearch);
            updateDeselectButton();
        });

        const updateDeselectButton = () => {
            const selectedCount = selectedPlayers.length;

            if (selectedCount === 0) {
                deselectButton.attr("disabled", true).text("Deselect All");
            } else {
                deselectButton.attr("disabled", null).text(`Deselect (${selectedCount})`);
            }

            if (selectedCount === 3) {
                deselectButton.text("Deselect All");
            }
        };

        deselectButton.on("click", function () {
            selectedPlayers.length = 0;
            isDefaultCleared = false; // Allow re-setting default players if no selections remain

            playerList.selectAll(".player-entry")
                .style("background-color", "#f5f5f5");

            updateDeselectButton();
            playerList.dispatch("playerSelectionChange", { detail: { selectedPlayers } });
            updateRadarChart();
        });
    });
});