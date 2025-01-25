/* Draw Scatterplot on PCA data and cluster */

let selection;
let scatterplotData;
let selectedPlayers = ["Nikola Jokić", "Stephen Curry"]; // Pre-selected players at page load
let excludedColors =  [
    "#9936ba",
    "#bba30a", 
    "#008029", 
    "#ef3eab ", 
    "#da1111", 
    "#2a00b4", 
    "#7ec808"  
    ] //to avoid reusing colors from the left section of the page (position colors)


//function to call the pca/cluster computation from server
function callPCAandCluster(n_clusters) {
    fetch("/pca_clusters", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ clusters: n_clusters }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error(data.error);
            alert("An error occurred while updating clusters.");
        } else { 
            scatterplotData = data;
            renderScatterplot(scatterplotData, excludedColors); 
            updateScatterplot(scatterplotData, selectedPlayers);

        }
    })
    .catch(error => {
        console.error("Error fetching cluster data:", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const dropdown = document.getElementById("cluster-dropdown");
    dropdown.value = "3";  // default number of clusters

    callPCAandCluster(3);

    dropdown.addEventListener("change", () => {
        const clusterNumber = dropdown.value;
        //call to update number of clusters
        callPCAandCluster(clusterNumber);
    });
});

// Listen to changes in selected players and update the plot accordingly
d3.select("#player-list").on("playerSelectionChange", function(event) {
    selectedPlayers = event.detail.selectedPlayers || [];
    updateScatterplot(scatterplotData, selectedPlayers);
});

//default PCA display
/*d3.csv("/data/pca_results.csv").then(data => {
    // Parse data
    data.forEach(d => {
        d.PC1 = +d.PC1; 
        d.PC2 = +d.PC2;
    });
    scatterplotData = data;
    renderScatterplot(scatterplotData, excludedColors);
    updateScatterplot(scatterplotData, selectedPlayers);
});*/

// Function that draws the scatterplot
function renderScatterplot(data, excludedColors = []) {
    const container = d3.select(".scatterplot");
    const boundingBox = container.node().getBoundingClientRect();

    const width = boundingBox.width - 120;
    const height = boundingBox.height - 160;
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };

    container.selectAll("svg").remove();
    container.select(".scatterplot-legend").remove();

    const svg = container
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const scatterGroup = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create a group for zoomable content
    const zoomableContent = scatterGroup.append("g");

    // Set up scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.PC1))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.PC2))
        .range([height, 0]);

    const availableColors = d3.schemeDark2.filter(color => !excludedColors.includes(color));
    const colorScale = d3.scaleOrdinal(availableColors);

     // Log the color for each unique cluster
     const uniqueClusters = Array.from(new Set(data.map(d => d.Cluster)));
     /*debug
     uniqueClusters.forEach(cluster => {
         console.log(`Cluster ${cluster} -> Color: ${colorScale(cluster)}`);
     });*/

    // Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    scatterGroup.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);

    scatterGroup.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    // Labels
    scatterGroup.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .style("text-anchor", "middle")
        .text("PC1")
        .style('font-size', '12px');

    scatterGroup.append("text")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 30)
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "middle")
        .text("PC2")
        .style('font-size', '12px');

    // Draw points
    zoomableContent.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.PC1))
        .attr("cy", d => yScale(d.PC2))
        .attr("r", 5)
        .style("fill", d => colorScale(d.Cluster))
        .style("opacity", 0.7)
        .on("mouseover", (event, d) => {
            d3.select(".scatterplot").append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("background", "white")
                .style("border", "1px solid black")
                .style("padding", "5px")
                .style("pointer-events", "none")
                .html(`<strong>${d.Player}</strong><br>PC1: ${d.PC1}<br>PC2: ${d.PC2}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            d3.select(".tooltip").remove();
        })
        .on("click", function (event, d) {
            const playerName = d.Player;
            if (selectedPlayers.includes(playerName)) {
                selectedPlayers.splice(selectedPlayers.indexOf(playerName), 1);
            } else if (selectedPlayers.length < 3) {
                selectedPlayers.push(playerName);
            } else {
                alert("You can only select up to 3 players.");
            }

            // Dispatch custom event for player selection
            d3.select("#player-list").dispatch("playerSelectionChange2", { detail: { selectedPlayers } });
            updateScatterplot(data, selectedPlayers);
        });

    updateScatterplot(data, selectedPlayers);

    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([1, 10]) // Zoom levels
        //.translateExtent([[0, 0], [width, height]]) // Restrict panning area
        .on("zoom", (event) => {
            const transform = event.transform;
            zoomableContent.attr("transform", transform); // Apply zoom/pan transformation
            scatterGroup.select(".x-axis").call(xAxis.scale(transform.rescaleX(xScale))); // Update x-axis
            scatterGroup.select(".y-axis").call(yAxis.scale(transform.rescaleY(yScale))); // Update y-axis
        });

    svg.call(zoom);

    // Legend
    const legendContainer = container.append("div").attr("class", "scatterplot-legend");

    // Sort uniqueClusters array to ensure labels are in order
    const sortedClusters = uniqueClusters.sort((a, b) => {
        const clusterA = parseInt(a.replace('Cluster ', ''), 10);
        const clusterB = parseInt(b.replace('Cluster ', ''), 10);
        return clusterA - clusterB; // Sort numerically
    });

    sortedClusters.forEach(cluster => {
        const legendItem = legendContainer.append("div").attr("class", "legend-item");
        legendItem.append("span")
            .attr("class", "legend-color")
            .style("background-color", colorScale(cluster));
        legendItem.append("span").text(cluster);
    });
}



// Update the plot according to user interaction
function updateScatterplot(data, selectedPlayers) {

    const container = d3.select(".scatterplot");
    const svg = container.select("svg g");
    const points = svg.selectAll(".dot").data(data);

    points
        .transition()
        .duration(300)
        .style("opacity", d => {
            if (selectedPlayers.length === 0) return 0.7; 
            return selectedPlayers.includes(d.Player) ? 1 : 0.05;
        })
        .style("stroke", d => (selectedPlayers.includes(d.Player) ? "black" : "none"))
        .style("stroke-width", d => (selectedPlayers.includes(d.Player) ? 2 : 0));
}
