d3.csv("data/players_data1.csv").then(data => {
    const playerList = d3.select("#player-list");
    const search = d3.select("#search-bar");
    const noPlayer = d3.select("#no-player-found");
  
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
