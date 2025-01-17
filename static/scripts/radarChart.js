export const renderRadarChart = (svgElement, players, radarMetrics, positionColors) => {
    // Map to readable metric labels
    const metricLabels = {
        PTS_n: "Points",
        REB_n: "Rebound",
        AST_n: "Assist",
        STL_n: "Steal",
        BLK_n: "Block",
        TOV_n: "Turnover"
    };

    // Dimensions and scaling
    const width = 350; // Reduced width
    const height = 350; // Reduced height
    const radius = Math.min(width, height) / 2 - 60; // Adjusted for smaller size
    const angleSlice = (2 * Math.PI) / radarMetrics.length;

    const rScale = d3.scaleLinear()
        .domain([0, 1]) // Normalized values range from 0 to 1
        .range([0, radius]);

    const radarLine = d3.lineRadial()
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveCardinalClosed); // Smooth cardinal curve

    const g = svgElement
        .attr("width", width)
        .attr("height", height)
        .html("") // Clear existing chart
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Draw grid lines and reference numbers
    const levels = 5;
    for (let level = 0; level < levels; level++) {
        const r = (radius / levels) * (level + 1);
        const labelValue = ((level + 1) / levels).toFixed(1);

        g.append("circle")
            .attr("r", r)
            .style("fill", "none")
            .style("stroke", "lightgray")
            .style("stroke-dasharray", "3,3");

        // Add reference number (value)
        g.append("text")
            .attr("x", 0)
            .attr("y", -r) // Place the label above the circle
            .attr("dy", "-0.3em")
            .style("text-anchor", "middle")
            .style("font-size", "10px")
            .style("fill", "gray")
            .text(labelValue);
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
            .attr("x", x * 1.15) // Position slightly outside the radius
            .attr("y", y * 1.15)
            .style("text-anchor", "middle")
            .style("font-size", "10px") // Smaller text
            .text(metricLabels[metric]); // Use readable labels
    });

    // Draw data
    players.forEach(player => {
        const dataPoints = radarMetrics.map((metric, i) => ({
            axis: metric,
            value: +player[metric],
            angle: angleSlice * i - Math.PI / 2
        }));

        // Draw the radar area
        g.append("path")
            .datum(dataPoints)
            .attr("d", radarLine)
            .style("fill", positionColors[player.Position])
            .style("fill-opacity", 0.2)
            .style("stroke", positionColors[player.Position])
            .style("stroke-width", 2);

        // Draw dots at intersections
        dataPoints.forEach(point => {
            const x = Math.cos(point.angle) * rScale(point.value);
            const y = Math.sin(point.angle) * rScale(point.value);

            g.append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 3) // Radius of the dot
                .style("fill", positionColors[player.Position])
                .style("stroke", "#fff")
                .style("stroke-width", 1);
        });
    });
};
