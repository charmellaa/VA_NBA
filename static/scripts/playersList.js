import { renderRadarChart } from './radarChart.js';

let selectedPlayers = ["Nikola Jokić", "Stephen Curry"];
let fullNbaData = [];
let selectedPlayerName = null;

// Get and display the efficiency comparison next to the radar chart
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
            comparisonDiv.html(""); // Clear any existing content first

            const width = 200; 
            const height = 200; 
            const barWidth = 40; 
            const maxEff = Math.max(data.selected_player_eff, data.average_eff) * 1.1; // 10% buffer for scaling
            const margin = { top: 20, right: 20, bottom: 50, left: 40 };

            // Assign the same colors of positions to the bars 
            const positionColors = {
                "Guard": "#9936ba",
                "Center-Forward": "#bba30a",
                "Forward": "#7ec808",
                "Forward-Center": "#2a00b4",
                "Forward-Guard": "#008029",
                "Guard-Forward": "#ef3eab ",
                "Center": "#da1111"
            };

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

// Let the Parallel Coordinates section update the chart at player selection/deselection
const updateParallelCoordinates = () => {
    const event = new CustomEvent("updateSelectedPlayers", { detail: { selectedPlayers } });
    document.dispatchEvent(event);
};

// Display the player's list
d3.csv("/data/playerslist.csv").then(playerListData => {

    // For Radar chart, values are normalized using Min-Max scaling
    d3.csv("./data/normalized_full.csv").then(fullData => {
        fullNbaData = fullData;

        const playerList = d3.select("#player-list");
        const search = d3.select("#search-bar");
        const noPlayer = d3.select("#no-player-found");
        const deselectButton = d3.select("#deselect-button");
        const radarChartSvg = d3.select("#radar-chart-svg");

        let selectedPosition = ""; // Track the selected position filter

        const maxSelections = 3;
        const radarMetrics = ["PTS_n", "REB_n", "AST_n", "STL_n", "BLK_n", "TOV_n"];

        // color code names and images with position colors
        const positionColors = {
            "Guard": "#9936ba",
            "Center-Forward": "#bba30a",
            "Forward": "#7ec808",
            "Forward-Center": "#2a00b4",
            "Forward-Guard": "#008029",
            "Guard-Forward": "#ef3eab ",
            "Center": "#da1111"
        };

        // render Radar 
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
                    .style("background-color", d => selectedPlayers.includes(d.Player) ? "#f9ecec" : "#f5f5f5")
                    .on("click", function (event, d) {
                        const playerName = d.Player;
        
                        if (selectedPlayers.includes(playerName)) {
                            selectedPlayers.splice(selectedPlayers.indexOf(playerName), 1);
                            d3.select(this).style("background-color", "#f5f5f5");
                        } else if (selectedPlayers.length < maxSelections) {
                            selectedPlayers.push(playerName);
                            d3.select(this).style("background-color", "#f9ecec");
                        } else {
                            alert("You can only select up to 3 players.");
                        }
        
                        playerList.dispatch("playerSelectionChange", { detail: { selectedPlayers } });
                        updateDeselectButton();  
                        updateRadarChart(); 
                        updateParallelCoordinates(); 

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

       /*const updatePlayersList = () => {
            const filteredData = playerListData.filter(player => {
                const matchesPosition = selectedPosition === "" || player.Position === selectedPosition;
                return matchesPosition;
            });

            renderPlayers(filteredData);
        };*/

        
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
                    comparisonDiv.html("Hover on player's radar for Efficiency comparison."); 
                    d3.select(this)
                    .style("fill-opacity", 0.2)
                    .style("stroke-width", 2);
                });

        };

        renderPlayers(playerListData);
        updateParallelCoordinates();
        updateRadarChart(); 
        updateDeselectButton(); 



        //Search for a specific player or players of a team
        search.on("input", function () {
            const searchInput = this.value.toLowerCase();
        
            // Filter by matching team or player name
            const filteredPlayers = playerListData.filter(player => {
                const matchesPlayerName = player.Player && player.Player.toLowerCase().includes(searchInput);
                const matchesTeamName = Object.entries(teamNameMap).some(([abbr, name]) =>
                    (abbr.toLowerCase().includes(searchInput) || name.toLowerCase().includes(searchInput)) &&
                    player.Team === abbr
                );
                return matchesPlayerName || matchesTeamName;
            });
        
            // Update the player list in real time
            renderPlayers(filteredPlayers);
            updateDeselectButton();
        });

        // Listen to player selection from the scatterplot section
        d3.select("#player-list").on("playerSelectionChange2", function (event) {
            selectedPlayers = event.detail.selectedPlayers || [];

            const playerEntries = d3.selectAll(".player-entry");

            playerEntries.each(function (d) {
                const isSelected = selectedPlayers.includes(d.Player);
                d3.select(this).style("background-color", isSelected ? "#f9ecec" : "#f5f5f5");
            });

            renderPlayers(playerListData);
            updateRadarChart();
            updateDeselectButton(); 
            updateParallelCoordinates(); 

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
