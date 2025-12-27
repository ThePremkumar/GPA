import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function SGPAChart({ data }) {
  const d3Container = useRef(null);

  useEffect(() => {
    if (data && d3Container.current) {
        // Clear previous SVG
        d3.select(d3Container.current).selectAll("*").remove();

        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const width = 600 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        const svg = d3.select(d3Container.current)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // X axis: scale
        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.term))
            .range([0, width]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(data.length));

        // Y axis: scale
        const y = d3.scaleLinear()
            .domain([0, 10])
            .range([height, 0]);
        
        svg.append("g")
            .call(d3.axisLeft(y));

        // Line
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(d => x(d.term))
                .y(d => y(d.gpa))
            );

        // Dots
        svg.selectAll("myCircles")
            .data(data)
            .enter()
            .append("circle")
            .attr("fill", "#8b5cf6")
            .attr("stroke", "none")
            .attr("cx", d => x(d.term))
            .attr("cy", d => y(d.gpa))
            .attr("r", 4);
    }
  }, [data]);

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
      <div ref={d3Container} />
    </div>
  );
}
