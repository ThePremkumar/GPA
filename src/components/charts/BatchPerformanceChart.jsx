/**
 * Batch Performance Donut Chart
 * D3.js donut/pie chart showing performance metrics by batch
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CHART_COLORS, ANIMATION } from '../../utils/constants';

export default function BatchPerformanceChart({ 
  data = [], 
  width = 400, 
  height = 400,
  innerRadiusRatio = 0.6,
  showLabels = true,
  animated = true 
}) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [activeSegment, setActiveSegment] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null });

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const radius = Math.min(width, height) / 2 - 40;
    const innerRadius = radius * innerRadiusRatio;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Color scale
    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', 
      '#f59e0b', '#06b6d4', '#84cc16', '#f43f5e'
    ];
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.batch || d.label))
      .range(colors);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Pie layout
    const pie = d3.pie()
      .value(d => d.count || d.value || 0)
      .sort(null)
      .padAngle(0.02);

    // Arc generator
    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(4);

    // Hover arc
    const hoverArc = d3.arc()
      .innerRadius(innerRadius - 5)
      .outerRadius(radius + 8)
      .cornerRadius(4);

    // Label arc
    const labelArc = d3.arc()
      .innerRadius(radius + 20)
      .outerRadius(radius + 20);

    // Create arcs
    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Draw paths
    const paths = arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.batch || d.data.label))
      .attr('stroke', 'rgba(15, 23, 42, 0.8)')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))');

    // Animation
    if (animated) {
      paths
        .attr('d', d3.arc()
          .innerRadius(0)
          .outerRadius(0)
          .startAngle(d => d.startAngle)
          .endAngle(d => d.endAngle)
        )
        .transition()
        .duration(ANIMATION.chart)
        .delay((d, i) => i * 100)
        .attrTween('d', function(d) {
          const interpolateRadius = d3.interpolate(0, radius);
          const interpolateInner = d3.interpolate(0, innerRadius);
          return function(t) {
            return d3.arc()
              .innerRadius(interpolateInner(t))
              .outerRadius(interpolateRadius(t))
              .cornerRadius(4)(d);
          };
        });
    }

    // Interaction
    paths
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', hoverArc);

        setActiveSegment(d.data);

        const rect = containerRef.current.getBoundingClientRect();
        const total = d3.sum(data, item => item.count || item.value || 0);
        const percentage = ((d.data.count || d.data.value) / total * 100).toFixed(1);

        setTooltip({
          visible: true,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top - 10,
          content: {
            label: d.data.batch || d.data.label,
            value: d.data.count || d.data.value,
            percentage,
            avgCGPA: d.data.avgCGPA
          }
        });
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', arc);

        setActiveSegment(null);
        setTooltip({ visible: false, x: 0, y: 0, content: null });
      });

    // Labels
    if (showLabels) {
      const labels = arcs.append('text')
        .attr('transform', d => {
          const pos = labelArc.centroid(d);
          const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
          pos[0] = radius * 0.8 * (midAngle < Math.PI ? 1 : -1);
          return `translate(${pos})`;
        })
        .attr('text-anchor', d => {
          const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
          return midAngle < Math.PI ? 'start' : 'end';
        })
        .attr('fill', '#94a3b8')
        .attr('font-size', '11px')
        .attr('opacity', 0)
        .text(d => {
          const total = d3.sum(data, item => item.count || item.value || 0);
          const percentage = ((d.data.count || d.data.value) / total * 100).toFixed(0);
          return percentage > 5 ? `${d.data.batch || d.data.label} (${percentage}%)` : '';
        });

      if (animated) {
        labels.transition()
          .delay(ANIMATION.chart + 200)
          .duration(300)
          .attr('opacity', 1);
      } else {
        labels.attr('opacity', 1);
      }
    }

    // Center text
    const centerGroup = g.append('g').attr('class', 'center-text');

    centerGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.3em')
      .attr('fill', '#f1f5f9')
      .attr('font-size', '28px')
      .attr('font-weight', '700')
      .text(d3.sum(data, d => d.count || d.value || 0));

    centerGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.4em')
      .attr('fill', '#64748b')
      .attr('font-size', '12px')
      .text('Total Students');

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f1f5f9')
      .attr('font-size', '16px')
      .attr('font-weight', '600')
      .text('Batch Distribution');

  }, [data, width, height, innerRadiusRatio, showLabels, animated]);

  return (
    <div 
      ref={containerRef}
      className="glass-panel" 
      style={{ 
        padding: '20px', 
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))'
      }}
    >
      <svg ref={svgRef}></svg>
      
      {/* Tooltip */}
      {tooltip.visible && tooltip.content && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            padding: '14px 18px',
            pointerEvents: 'none',
            transform: 'translate(-50%, -100%)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 10,
            minWidth: '160px'
          }}
        >
          <div style={{ fontWeight: '600', fontSize: '14px', color: '#f1f5f9', marginBottom: '8px' }}>
            {tooltip.content.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#94a3b8' }}>Students:</span>
              <span style={{ color: '#f1f5f9', fontWeight: '500' }}>{tooltip.content.value}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#94a3b8' }}>Share:</span>
              <span style={{ color: CHART_COLORS.primary, fontWeight: '500' }}>{tooltip.content.percentage}%</span>
            </div>
            {tooltip.content.avgCGPA && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Avg CGPA:</span>
                <span style={{ color: CHART_COLORS.accent, fontWeight: '500' }}>{tooltip.content.avgCGPA}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '16px'
      }}>
        {data.map((item, i) => {
          const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#84cc16', '#f43f5e'];
          const isActive = activeSegment && (activeSegment.batch || activeSegment.label) === (item.batch || item.label);
          
          return (
            <div 
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderRadius: '6px',
                transition: 'background 0.2s'
              }}
            >
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '3px',
                background: colors[i % colors.length]
              }} />
              <span style={{ 
                fontSize: '11px', 
                color: isActive ? '#f1f5f9' : '#94a3b8',
                fontWeight: isActive ? '500' : 'normal'
              }}>
                {item.batch || item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
