/**
 * CGPA Distribution Chart
 * D3.js bar chart showing CGPA distribution across students
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CHART_COLORS, ANIMATION } from '../../utils/constants';

export default function CGPADistributionChart({ 
  data = [], 
  width = 600, 
  height = 350,
  showLegend = true,
  animated = true 
}) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Add gradient definition
    const defs = svg.append('defs');
    
    const gradient = defs.append('linearGradient')
      .attr('id', 'barGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', CHART_COLORS.primary);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', CHART_COLORS.secondary);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create CGPA ranges
    const ranges = [
      { label: '9.0-10.0', min: 9.0, max: 10.0, color: '#22c55e' },
      { label: '8.0-8.99', min: 8.0, max: 8.99, color: '#3b82f6' },
      { label: '7.0-7.99', min: 7.0, max: 7.99, color: '#8b5cf6' },
      { label: '6.0-6.99', min: 6.0, max: 6.99, color: '#f59e0b' },
      { label: '5.0-5.99', min: 5.0, max: 5.99, color: '#ef4444' },
      { label: '<5.0', min: 0, max: 4.99, color: '#dc2626' }
    ];

    // Count students in each range
    const distribution = ranges.map(range => {
      const count = data.filter(d => {
        const cgpa = typeof d === 'number' ? d : (d.cgpa || 0);
        return cgpa >= range.min && cgpa <= range.max;
      }).length;
      return { ...range, count };
    });

    // X Scale
    const x = d3.scaleBand()
      .domain(distribution.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.3);

    // Y Scale
    const y = d3.scaleLinear()
      .domain([0, d3.max(distribution, d => d.count) || 10])
      .nice()
      .range([innerHeight, 0]);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .tickSize(-innerWidth)
        .tickFormat('')
      )
      .selectAll('line')
      .attr('stroke', 'rgba(255,255,255,0.1)');

    // Remove grid domain line
    g.select('.grid .domain').remove();

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px');

    g.selectAll('.domain, .tick line')
      .attr('stroke', 'rgba(255,255,255,0.2)');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px');

    // Y Axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px')
      .text('Number of Students');

    // Bars
    const bars = g.selectAll('.bar')
      .data(distribution)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.label))
      .attr('width', x.bandwidth())
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', d => d.color)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))');

    // Animation
    if (animated) {
      bars
        .attr('y', innerHeight)
        .attr('height', 0)
        .transition()
        .duration(ANIMATION.chart)
        .delay((d, i) => i * 100)
        .ease(d3.easeCubicOut)
        .attr('y', d => y(d.count))
        .attr('height', d => innerHeight - y(d.count));
    } else {
      bars
        .attr('y', d => y(d.count))
        .attr('height', d => innerHeight - y(d.count));
    }

    // Hover effects
    bars
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('opacity', 0.8)
          .attr('transform', `translateY(-2px)`);
        
        const rect = containerRef.current.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top - 40,
          content: `${d.label}: ${d.count} students`
        });
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('opacity', 1)
          .attr('transform', 'translateY(0)');
        
        setTooltip({ visible: false, x: 0, y: 0, content: '' });
      });

    // Value labels on bars
    g.selectAll('.value-label')
      .data(distribution)
      .enter()
      .append('text')
      .attr('class', 'value-label')
      .attr('x', d => x(d.label) + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f1f5f9')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('opacity', 0)
      .text(d => d.count)
      .transition()
      .delay(animated ? ANIMATION.chart + 100 : 0)
      .duration(300)
      .attr('opacity', 1);

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f1f5f9')
      .attr('font-size', '16px')
      .attr('font-weight', '600')
      .text('CGPA Distribution');

  }, [data, width, height, animated]);

  return (
    <div 
      ref={containerRef}
      className="glass-panel" 
      style={{ 
        padding: '24px', 
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))'
      }}
    >
      <svg ref={svgRef}></svg>
      
      {/* Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '13px',
            color: '#f1f5f9',
            pointerEvents: 'none',
            transform: 'translateX(-50%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10
          }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '16px', 
          marginTop: '16px',
          flexWrap: 'wrap'
        }}>
          {[
            { color: '#22c55e', label: 'Excellent (9+)' },
            { color: '#3b82f6', label: 'Very Good (8-9)' },
            { color: '#8b5cf6', label: 'Good (7-8)' },
            { color: '#f59e0b', label: 'Average (6-7)' },
            { color: '#ef4444', label: 'Below Avg (<6)' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '3px', 
                background: item.color 
              }} />
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
