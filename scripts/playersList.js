d3.csv("data/players_data1.csv").then(data => {
    const playerList = d3.select("#player-list");
    const search = d3.select("#search-bar");
    const noPlayer = d3.select("#no-player-found");
    
    const selectedPlayers = []; 
    const maxSelections = 3;

    const positionColors = {
        "Guard": "#8d108d",
        "Center-Forward": "#0b5cad",
        "Forward": "#eea513",
        "Forward-Center": "#d23a3a",
        "Forward-Guard": "#259e25",
        "Guard-Forward": "#d00a8e",
        "Center": "#026b6b"
    };

  const renderPlayers = (filtered_data) => {
    playerList.html("");

    if (filtered_data.length > 0) {
        noPlayer.style("display", "none");

        playerList.selectAll(".player-entry")
            .data(filtered_data)
            .enter()
            .append("div")
            .attr("class", "player-entry")
            .attr("data-player-name", d => d.Player) // Store player name as data attribute
            .style("background-color", d => selectedPlayers.includes(d.Player) ? "#d9f2d9" : "#f5f5f5")
                .on("click", function(event, d) {
                    const playerName = d.Player;

                    if (selectedPlayers.includes(playerName)) {
                        // Deselect player
                        selectedPlayers.splice(selectedPlayers.indexOf(playerName), 1);
                        d3.select(this).style("background-color", "#f5f5f5");
                    } else if (selectedPlayers.length < maxSelections) {
                        // Select player
                        selectedPlayers.push(playerName);
                        d3.select(this).style("background-color", "#d9f2d9");
                    } else {
                        alert("You can only select up to 3 players.");
                    }

                    // Update scatterplot based on the selection through custom event
                    playerList.dispatch("playerSelectionChange", { detail: { selectedPlayers } });
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
             </div>
            `);
    } else {
        noPlayer.style("display", "block");
        }
    };

    renderPlayers(data);

    search.on("input", function() {
        const searchName  = this.value.toLowerCase();

        const playerSearch = data.filter(player => 
            player.Player && player.Player.toLowerCase().includes(searchName)
        );

        renderPlayers(playerSearch);
    });
})
.catch(error => {
    console.error("Error loading the CSV file:", error);
});
