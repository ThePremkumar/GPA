/**
 * Admin Activity Timeline Chart
 * D3.js line/area chart showing admin activities over time
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CHART_COLORS, ANIMATION } from '../../utils/constants';

export default function ActivityTimelineChart({ 
  data = [], 
  width = 700, 
  height = 320,
  timeRange = 7, // days
  showArea = true,
  animated = true 
}) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 40, right: 30, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Add gradient definitions
    const defs = svg.append('defs');
    
    // Area gradient
    const areaGradient = defs.append('linearGradient')
      .attr('id', 'areaGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    
    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', CHART_COLORS.primary)
      .attr('stop-opacity', 0.6);
    
    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', CHART_COLORS.primary)
      .attr('stop-opacity', 0.05);

    // Line gradient
    const lineGradient = defs.append('linearGradient')
      .attr('id', 'lineGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    
    lineGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', CHART_COLORS.primary);
    
    lineGradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', CHART_COLORS.secondary);
    
    lineGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', CHART_COLORS.accent);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Process data - aggregate by day
    const processedData = processActivityData(data, timeRange);

    // X Scale (time)
    const x = d3.scaleTime()
      .domain(d3.extent(processedData, d => d.date))
      .range([0, innerWidth]);

    // Y Scale
    const maxCount = d3.max(processedData, d => d.count) || 10;
    const y = d3.scaleLinear()
      .domain([0, maxCount + Math.ceil(maxCount * 0.1)])
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
      .attr('stroke', 'rgba(255,255,255,0.08)');

    g.select('.grid .domain').remove();

    // Area generator
    const area = d3.area()
      .x(d => x(d.date))
      .y0(innerHeight)
      .y1(d => y(d.count))
      .curve(d3.curveMonotoneX);

    // Line generator
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    // Draw area
    if (showArea) {
      const areaPath = g.append('path')
        .datum(processedData)
        .attr('fill', 'url(#areaGradient)')
        .attr('d', area);

      if (animated) {
        areaPath
          .attr('opacity', 0)
          .transition()
          .duration(ANIMATION.chart)
          .attr('opacity', 1);
      }
    }

    // Draw line
    const linePath = g.append('path')
      .datum(processedData)
      .attr('fill', 'none')
      .attr('stroke', 'url(#lineGradient)')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', line);

    // Animate line drawing
    if (animated) {
      const totalLength = linePath.node().getTotalLength();
      linePath
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(ANIMATION.chart * 1.5)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);
    }

    // Data points
    const points = g.selectAll('.data-point')
      .data(processedData)
      .enter()
      .append('g')
      .attr('class', 'data-point')
      .attr('transform', d => `translate(${x(d.date)},${y(d.count)})`);

    // Outer circle (glow effect)
    points.append('circle')
      .attr('r', 8)
      .attr('fill', CHART_COLORS.primary)
      .attr('opacity', 0.2);

    // Inner circle
    points.append('circle')
      .attr('r', 5)
      .attr('fill', '#1e293b')
      .attr('stroke', CHART_COLORS.primary)
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this.parentNode).select('circle:first-child')
          .transition()
          .duration(150)
          .attr('r', 12)
          .attr('opacity', 0.4);

        const rect = containerRef.current.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top - 45,
          content: `${d.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${d.count} activities`
        });
      })
      .on('mouseout', function() {
        d3.select(this.parentNode).select('circle:first-child')
          .transition()
          .duration(150)
          .attr('r', 8)
          .attr('opacity', 0.2);

        setTooltip({ visible: false, x: 0, y: 0, content: '' });
      });

    // Animate points
    if (animated) {
      points
        .attr('opacity', 0)
        .transition()
        .delay((d, i) => ANIMATION.chart + i * 50)
        .duration(300)
        .attr('opacity', 1);
    }

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x)
        .ticks(timeRange > 14 ? 7 : timeRange)
        .tickFormat(d3.timeFormat('%b %d'))
      )
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px');

    g.selectAll('.domain, .tick line')
      .attr('stroke', 'rgba(255,255,255,0.2)');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px');

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 24)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f1f5f9')
      .attr('font-size', '16px')
      .attr('font-weight', '600')
      .text('Admin Activity Timeline');

    // Subtitle
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .text(`Last ${timeRange} days`);

  }, [data, width, height, timeRange, showArea, animated]);

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
      {tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            color: '#f1f5f9',
            pointerEvents: 'none',
            transform: 'translateX(-50%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10,
            whiteSpace: 'nowrap'
          }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Stats summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '32px',
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px'
      }}>
        {(() => {
          const processedData = processActivityData(data, timeRange);
          const total = processedData.reduce((sum, d) => sum + d.count, 0);
          const avg = (total / processedData.length).toFixed(1);
          const max = Math.max(...processedData.map(d => d.count));

          return [
            { label: 'Total Activities', value: total, color: CHART_COLORS.primary },
            { label: 'Daily Average', value: avg, color: CHART_COLORS.secondary },
            { label: 'Peak Day', value: max, color: CHART_COLORS.accent }
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                {stat.label}
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}

// Helper function to process activity data
function processActivityData(data, days) {
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dayStr = date.toISOString().split('T')[0];
    
    // Count activities for this day
    const count = data.filter(activity => {
      const activityDate = activity.timestamp instanceof Date 
        ? activity.timestamp 
        : (activity.timestamp?.toDate?.() || new Date(activity.createdAt || 0));
      return activityDate.toISOString().split('T')[0] === dayStr;
    }).length;

    result.push({ date, count, dayStr });
  }

  return result;
}
