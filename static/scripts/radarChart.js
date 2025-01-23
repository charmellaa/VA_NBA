export const renderRadarChart = (svgElement, players, radarMetrics, positionColors) => {
    const metricLabels = {
        PTS_n: "Points",
        REB_n: "Rebound",
        AST_n: "Assist",
        STL_n: "Steal",
        BLK_n: "Block",
        TOV_n: "Turnover"
    };

    const width = 350; 
    const height = 350; 
    const radius = Math.min(width, height) / 2 - 60; 
    const angleSlice = (2 * Math.PI) / radarMetrics.length;

    const rScale = d3.scaleLinear()
        .domain([0, 1]) // Normalized values range from 0 to 1
        .range([0, radius]);

    const radarLine = d3.lineRadial()
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveCardinalClosed); 

    // Zoom
    const zoom = d3.zoom()
        .scaleExtent([1, 5])
        .on("zoom", (event) => {
            chartGroup.attr("transform", event.transform); 
        });

    // Clear and setup the SVG
    svgElement
        .attr("width", width)
        .attr("height", height)
        .html("")
        .call(zoom); // Attach zoom

    const chartGroup = svgElement
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2.5})`);

    // Draw lines
    const levels = 5;
    for (let level = 0; level < levels; level++) {
        const r = (radius / levels) * (level + 1);
        const labelValue = ((level + 1) / levels).toFixed(1);

        chartGroup.append("circle")
            .attr("r", r)
            .style("fill", "none")
            .style("stroke", "lightgray")
            .style("stroke-dasharray", "3,3");

        chartGroup.append("text")
            .attr("x", 0)
            .attr("y", -r)
            .attr("dy", "-0.3em")
            .style("text-anchor", "middle")
            .style("font-size", "10px")
            .style("fill", "gray")
            .text(labelValue);
    }

    radarMetrics.forEach((metric, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        chartGroup.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", x)
            .attr("y2", y)
            .style("stroke", "lightgray")
            .style("stroke-width", 1);

        chartGroup.append("text")
            .attr("x", x * 1.15) 
            .attr("y", y * 1.15)
            .style("text-anchor", "middle")
            .style("font-size", "10px") 
            .text(metricLabels[metric]); 
    });

    // Draw data for chart
    players.forEach(player => {
        const dataPoints = radarMetrics.map((metric, i) => ({
            axis: metric,
            value: +player[metric],
            Player: player.Player,
            angle: angleSlice * i - Math.PI / 2
        }));

        // Draw the radar area
        const path = chartGroup.append("path")
            .datum(dataPoints)
            .attr("d", radarLine)
            .style("fill", positionColors[player.Position])
            .style("fill-opacity", 0.2)
            .style("stroke", positionColors[player.Position])
            .style("stroke-width", 2);

        // Hover
        path
            .on("mouseover", function () {
                d3.select(this)
                    .style("fill-opacity", 0.4)
                    .style("stroke-width", 3);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .style("fill-opacity", 0.2)
                    .style("stroke-width", 2);
            });

        // Display dots at intersections
        dataPoints.forEach(point => {
            const x = Math.cos(point.angle) * rScale(point.value);
            const y = Math.sin(point.angle) * rScale(point.value);

            
            const tooltip = svgElement
                .append("text")
                .attr("x", x + width / 2)
                .attr("y", y + height / 2.5)
                .attr("dy", "-0.5em")
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .attr("fill", "black")
                .style("visibility", "hidden");

            chartGroup.append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 3)
                .style("fill", positionColors[player.Position])
                .style("stroke", "#fff")
                .style("stroke-width", 2)
                .on("mouseover", function () {
                    tooltip.text(`${point.value.toFixed(2)}`)
                    .style("visibility", "visible")
                    .style("font-weight", "bold");
                    d3.select(this).attr("r", 5); //make the dot bigger
                })
                .on("mousemove", function (event) {
                    tooltip
                        .attr("x", event.offsetX)
                        .attr("y", event.offsetY - 10); // update tooltip position
                    })
                .on("mouseout", function () {
                    tooltip.style("visibility", "hidden");
                    d3.select(this).attr("r", 3); // go back to original size
                });
        });
    });
};
