// Load PCA Data and Render Scatterplot
d3.csv("data/pca_results.csv").then(data => {
    // Parse data
    data.forEach(d => {
        d.PC1 = +d.PC1; // Convert to numeric
        d.PC2 = +d.PC2;
    });

    // Create Scatterplot
    renderScatterplot(data);
});

function renderScatterplot(data) {
    const container = d3.select(".scatterplot");
    const boundingBox = container.node().getBoundingClientRect();

    const width = boundingBox.width - 100;
    const height = boundingBox.height - 100;

    const margin = { top: 20, right: 20, bottom: 40, left: 60 };

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
            const tooltip = d3.select(".scatterplot").append("div")
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
}
