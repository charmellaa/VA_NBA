// Load PCA Data and Render Scatterplot
let scatterplotData;
let selection;

document.addEventListener("DOMContentLoaded", () => {
    const dropdown = document.getElementById("cluster-dropdown");
    dropdown.value = "3";  // Reset to default cluster number (3)

    dropdown.addEventListener("change", () => {
        const selectedClusters = dropdown.value;

        // Fetch updated cluster data from the server
        fetch("/update_clusters", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ clusters: selectedClusters }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                alert("An error occurred while updating clusters.");
            } else {
                renderScatterplot(data); // Redraw scatterplot with new data
            }
        })
        .catch(error => {
            console.error("Error fetching cluster data:", error);
        });
    });
});

d3.csv("/data/pca_results.csv").then(data => {
    // Parse data
    data.forEach(d => {
        d.PC1 = +d.PC1; // Convert to numeric
        d.PC2 = +d.PC2;
    });

    scatterplotData = data;

    // Create Scatterplot
    renderScatterplot(scatterplotData);

    // changes in selected players
    d3.select("#player-list").on("playerSelectionChange", function(event) {
        const selectedPlayers = event.detail.selectedPlayers || [];
        updateScatterplot(scatterplotData, selectedPlayers);
    });
});

function renderScatterplot(data) {
    const container = d3.select(".scatterplot");
    const boundingBox = container.node().getBoundingClientRect();

    const width = boundingBox.width - 100;
    const height = boundingBox.height - 120;

    const margin = { top: 20, right: 20, bottom: 60, left: 60 };

    // Clear existing scatterplot if any
    container.selectAll("svg").remove();
    container.select(".scatterplot-legend").remove();

    const svg = container
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Set up scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.PC1))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.PC2))
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .style("text-anchor", "middle")
        .text("PC1");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 30)
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "middle")
        .text("PC2");

    // Draw points
    svg.selectAll(".dot")
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
        });
    
    updateScatterplot(data, selectedPlayers);
    // Add legend below the scatterplot
    const legendContainer = container.append("div").attr("class", "scatterplot-legend");

    const uniqueClusters = Array.from(new Set(data.map(d => d.Cluster)));

    uniqueClusters.forEach(cluster => {
        const legendItem = legendContainer.append("div").attr("class", "legend-item");
        legendItem.append("span")
            .attr("class", "legend-color")
            .style("background-color", colorScale(cluster));
        legendItem.append("span").text(cluster);
    });
}

function updateScatterplot(data, selectedPlayers) {

    const container = d3.select(".scatterplot");
    const svg = container.select("svg g");

    // Update points visibility based on selection
    const points = svg.selectAll(".dot")
        .data(data);

    points
        .transition()
        .duration(300)
        .style("opacity", d => {
            if (selectedPlayers.length === 0) return 0.7; // Default opacity
            return selectedPlayers.includes(d.Player) ? 1 : 0.2; // Highlight selected players
        })
        .style("stroke", d => (selectedPlayers.includes(d.Player) ? "black" : "none"))
        .style("stroke-width", d => (selectedPlayers.includes(d.Player) ? 2 : 0));
}