import { renderRadarChart } from './radarChart.js';

let selectedPlayers = ["LeBron James", "Stephen Curry"]; // Pre-selected players
let fullNbaData = [];
let selectedPlayerName = null;

const updateParallelCoordinates = () => {
    const event = new CustomEvent("updateSelectedPlayers", { detail: { selectedPlayers } });
    document.dispatchEvent(event);
    //console.log("Dispatching selectedPlayers:", selectedPlayers);

};

// Function to fetch and display eff comparison
const displayEffComparison = (playerName) => {
    fetch('/get_eff_comparison', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playerName: playerName })
    })
    .then(response => response.json())
    .then(data => {
        if (data.selected_player_eff && data.average_eff) {
            const comparisonDiv = d3.select(".eff-comparison");
            comparisonDiv.html(""); // Clear any existing content

            const width = 200; // Updated chart width
            const height = 200; // Updated chart height
            const barWidth = 40; // Adjusted bar width
            const maxEff = Math.max(data.selected_player_eff, data.average_eff) * 1.1; // Add 10% buffer for scaling
            const margin = { top: 20, right: 20, bottom: 50, left: 40 };

            const positionColors = {
                "Guard": "#9936ba",
                "Center-Forward": "#bba30a",
                "Forward": "#7ec808",
                "Forward-Center": "#2a00b4",
                "Forward-Guard": "#008029",
                "Guard-Forward": "#d01c8b",
                "Center": "#da1111"
            };

            // Determine the player's position and color
            const playerPosition = fullNbaData.find(player => player.Player === playerName)?.Position || "Guard";
            const playerColor = positionColors[playerPosition] || "#000000";

            // Create SVG for the bar chart
            const svg = comparisonDiv.append("svg")
                .attr("width", width)
                .attr("height", height);

            // Scale for the bar height
            const yScale = d3.scaleLinear()
                .domain([0, maxEff])
                .range([height - margin.bottom, margin.top]);

            // Data for the bars
            const barData = [
                { label: playerName, value: data.selected_player_eff, color: playerColor },
                { label: "Others", value: data.average_eff, color: "#b0b0b0" }
            ];

            // Render bars
            svg.selectAll("rect")
                .data(barData)
                .enter()
                .append("rect")
                .attr("x", (d, i) => i * (barWidth + 40) + margin.left)
                .attr("y", d => yScale(d.value))
                .attr("width", barWidth)
                .attr("height", d => height - margin.bottom - yScale(d.value))
                .attr("fill", d => d.color);

            // Add values above the bars
            svg.selectAll("text.value")
                .data(barData)
                .enter()
                .append("text")
                .attr("class", "value")
                .attr("x", (d, i) => i * (barWidth + 40) + margin.left + barWidth / 2)
                .attr("y", d => yScale(d.value) - 5)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .style("fill", "#333")
                .text(d => d.value.toFixed(2));

            // Add labels under the bars
            svg.selectAll("text.label")
                .data(barData)
                .enter()
                .append("text")
                .attr("class", "label")
                .attr("x", (d, i) => i * (barWidth + 40) + margin.left + barWidth / 2)
                .attr("y", height - margin.bottom + 15)
                .attr("text-anchor", "middle")
                .style("font-size", "11px")
                .style("fill", "#333")
                .text(d => d.label);
        } else {
            console.error("Error fetching EFF comparison data");
        }
    })
    .catch(error => console.error("Error fetching EFF comparison data:", error));
};

d3.csv("/data/playerslist.csv").then(playerListData => {
    d3.csv("./data/normalized_full.csv").then(fullData => {
        fullNbaData = fullData;

        const playerList = d3.select("#player-list");
        const search = d3.select("#search-bar");
        const noPlayer = d3.select("#no-player-found");
        const deselectButton = d3.select("#deselect-button");
        const radarChartSvg = d3.select("#radar-chart-svg");

        const maxSelections = 3;
        const radarMetrics = ["PTS_n", "REB_n", "AST_n", "STL_n", "BLK_n", "TOV_n"];
        const positionColors = {
            "Guard": "#9936ba",
            "Center-Forward": "#bba30a",
            "Forward": "#7ec808",
            "Forward-Center": "#2a00b4",
            "Forward-Guard": "#008029",
            "Guard-Forward": "#d01c8b",
            "Center": "#da1111"
        };

        renderRadarChart(radarChartSvg, [], radarMetrics, positionColors);

        const renderPlayers = (filtered_data) => {
            playerList.html("");
        
            if (filtered_data.length > 0) {
                noPlayer.style("display", "none");
        
                // move selected players to the top
                const sortedData = filtered_data.sort((a, b) => {
                    const aSelected = selectedPlayers.includes(a.Player) ? -1 : 1;
                    const bSelected = selectedPlayers.includes(b.Player) ? -1 : 1;
                    return aSelected - bSelected;
                });
        
                playerList.selectAll(".player-entry")
                    .data(sortedData)
                    .enter()
                    .append("div")
                    .attr("class", "player-entry")
                    .attr("data-player-name", d => d.Player)
                    .style("background-color", d => selectedPlayers.includes(d.Player) ? "#d9f2d9" : "#f5f5f5")
                    .on("click", function (event, d) {
                        const playerName = d.Player;
        
                        if (selectedPlayers.includes(playerName)) {
                            selectedPlayers.splice(selectedPlayers.indexOf(playerName), 1);
                            d3.select(this).style("background-color", "#f5f5f5");
                        } else if (selectedPlayers.length < maxSelections) {
                            selectedPlayers.push(playerName);
                            d3.select(this).style("background-color", "#d9f2d9");
                        } else {
                            alert("You can only select up to 3 players.");
                        }
        
                        playerList.dispatch("playerSelectionChange", { detail: { selectedPlayers } });
                        updateDeselectButton();  
                        updateRadarChart(); 
                        updateParallelCoordinates(); // Notify parallel coordinates chart

                        renderPlayers(playerListData); 
                    })
                    .html(d => `
                        <div class="player-photo">
                            <img src="${d.Player_img && d.Player_img !== 'null' ? d.Player_img : 'default.png'}" alt="${d.Player || 'Unknown Player'}" style="border: 2px solid ${positionColors[d.Position]}">
                        </div>
                        <div class="player-info">
                            <p class="player-name" style="color: ${positionColors[d.Position] || '#ffffff'};">
                                ${d.Player || 'No Name Available'}
                            </p>
                            <p>Team: ${d.Team || 'Unknown Team'}<br>
                            Number: ${d.Number || 'N/A'}<br>
                           <!-- Height: ${d.Height_inches ? d.Height_inches + ' inches' : 'Height not available'}<br>
                            Weight: ${d.Weight_lbs ? d.Weight_lbs + ' lbs' : 'Weight not available'}<br> -->
                        </div>`
                    );
            } else {
                noPlayer.style("display", "block");
            }
        };

        
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

        const updateRadarChart = () => {
            const selectedData = fullNbaData.filter(player => selectedPlayers.includes(player.Player));
            renderRadarChart(radarChartSvg, selectedData, radarMetrics, positionColors);

            radarChartSvg.selectAll("path")
                .on("mouseover", function(event, d) {
                    const playerName = d[0].Player; 
                    selectedPlayerName = playerName; 
                    displayEffComparison(playerName); 
                    d3.select(this)
                    .style("fill-opacity", 0.4)
                    .style("stroke-width", 3);
                })
                .on("mouseout", function() {
                    const comparisonDiv = d3.select(".eff-comparison");
                    comparisonDiv.html("Hover for player's Efficiency."); 
                    d3.select(this)
                    .style("fill-opacity", 0.2)
                    .style("stroke-width", 2);
                });

        };

        renderPlayers(playerListData);
        updateParallelCoordinates(); // Notify parallel coordinates chart
        updateRadarChart(); 
        updateDeselectButton(); 

        search.on("input", function () {
            const searchName = this.value.toLowerCase();
            const playerSearch = playerListData.filter(player =>
                player.Player && player.Player.toLowerCase().includes(searchName)
            );

            renderPlayers(playerSearch);
            updateDeselectButton();
        });


        d3.select("#player-list").on("playerSelectionChange2", function (event) {
            selectedPlayers = event.detail.selectedPlayers || [];

            const playerEntries = d3.selectAll(".player-entry");

            playerEntries.each(function (d) {
                const isSelected = selectedPlayers.includes(d.Player);
                d3.select(this).style("background-color", isSelected ? "#d9f2d9" : "#f5f5f5");
            });

            renderPlayers(playerListData);
            updateRadarChart();
            updateDeselectButton(); 
            updateParallelCoordinates(); // Notify parallel coordinates chart

        });

        deselectButton.on("click", function () {
            selectedPlayers.length = 0;

            playerList.selectAll(".player-entry")
                .style("background-color", "#f5f5f5");

            updateDeselectButton();
            playerList.dispatch("playerSelectionChange", { detail: { selectedPlayers } });
            updateRadarChart();
            updateParallelCoordinates(); // Notify parallel coordinates chart


        });

    });
});
