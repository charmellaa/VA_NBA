// radarChart.js
export const renderRadarChart = (svgElement, players, radarMetrics, positionColors) => {
    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 50;

    const angleSlice = (2 * Math.PI) / radarMetrics.length;

    const rScale = d3.scaleLinear()
        .domain([0, d3.max(players.map(p => Math.max(...radarMetrics.map(m => +p[m]))))])
        .range([0, radius]);

    const radarLine = d3.lineRadial()
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    const g = svgElement
        .attr("width", width)
        .attr("height", height)
        .html("") // Clear existing chart
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Draw grid lines
    const levels = 5;
    for (let level = 0; level < levels; level++) {
        const r = (radius / levels) * (level + 1);
        g.append("circle")
            .attr("r", r)
            .style("fill", "none")
            .style("stroke", "lightgray")
            .style("stroke-dasharray", "3,3");
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
            .attr("x", x * 1.1)
            .attr("y", y * 1.1)
            .style("text-anchor", "middle")
            .text(metric);
    });

    // Draw data
    players.forEach(player => {
        const dataPoints = radarMetrics.map((metric, i) => ({
            axis: metric,
            value: +player[metric]
        }));

        g.append("path")
            .datum(dataPoints)
            .attr("d", radarLine)
            .style("fill", positionColors[player.Position])
            .style("fill-opacity", 0.2)
            .style("stroke", positionColors[player.Position])
            .style("stroke-width", 2);
    });
};
