import { renderRadarChart } from './radarChart.js';

let selectedPlayers = ["LeBron James", "Stephen Curry"]; // Pre-selected players
let fullNbaData = [];
let selectedPlayerName = null;

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
            comparisonDiv.html(`
                <h4>Efficiency:</h4>
                <p><strong>${playerName}:</strong> ${data.selected_player_eff.toFixed(2)}</p>
                <p><strong>Average of Other Players:</strong> ${data.average_eff.toFixed(2)}</p>
            `);
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
            "Guard": "#8d108d",
            "Center-Forward": "#0b5cad",
            "Forward": "#eea513",
            "Forward-Center": "#d23a3a",
            "Forward-Guard": "#259e25",
            "Guard-Forward": "#d00a8e",
            "Center": "#026b6b"
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
                            Height: ${d.Height_inches ? d.Height_inches + ' inches' : 'Height not available'}<br>
                            Weight: ${d.Weight_lbs ? d.Weight_lbs + ' lbs' : 'Weight not available'}<br>
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
                })
                .on("mouseout", function() {
                    const comparisonDiv = d3.select(".eff-comparison");
                    comparisonDiv.html("Hover to see simplified Player Efficiency Rating."); 
                });

        };

        renderPlayers(playerListData);
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
        });

        deselectButton.on("click", function () {
            selectedPlayers.length = 0;

            playerList.selectAll(".player-entry")
                .style("background-color", "#f5f5f5");

            updateDeselectButton();
            playerList.dispatch("playerSelectionChange", { detail: { selectedPlayers } });
            updateRadarChart();
        });

    });
});
