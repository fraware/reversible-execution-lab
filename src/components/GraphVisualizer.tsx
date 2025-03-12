
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphEdge, GraphOptions } from '@/types/graph';

interface GraphVisualizerProps {
  graphData: GraphData;
  options?: Partial<GraphOptions>;
  onNodeClick?: (node: GraphNode) => void;
}

const defaultOptions: GraphOptions = {
  layout: 'force',
  showObjectProperties: true,
  showPrimitiveValues: true,
  highlightChanges: true
};

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ 
  graphData, 
  options = {}, 
  onNodeClick 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Update dimensions when container size changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [containerRef]);
  
  // Render the graph whenever data or dimensions change
  useEffect(() => {
    if (!svgRef.current || !graphData || !dimensions.width || !dimensions.height) return;
    
    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();
    
    const svg = d3.select(svgRef.current);
    const width = dimensions.width;
    const height = dimensions.height;
    
    // Create a group for the graph
    const g = svg.append("g");
    
    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom as any);
    
    // Create the simulation
    const simulation = d3.forceSimulation<GraphNode>()
      .force("link", d3.forceLink<GraphNode, GraphEdge>().id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1));
    
    // Create the links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graphData.edges)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5);
    
    // Add arrowheads for directionality
    svg.append("defs").selectAll("marker")
      .data(["arrow"])
      .enter().append("marker")
      .attr("id", d => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");
    
    link.attr("marker-end", "url(#arrow)");
    
    // Create the link labels
    const edgeLabels = g.append("g")
      .attr("class", "edge-labels")
      .selectAll("text")
      .data(graphData.edges.filter(e => e.label))
      .enter()
      .append("text")
      .attr("font-size", 10)
      .attr("fill", "#666")
      .text(d => d.label || "");
    
    // Create the nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll(".node")
      .data(graphData.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any)
      .on("click", (event, d) => {
        if (onNodeClick) onNodeClick(d);
      });
    
    // Add circles for nodes
    node.append("circle")
      .attr("r", d => getNodeRadius(d))
      .attr("fill", d => getNodeColor(d))
      .attr("stroke", d => mergedOptions.highlightChanges && d.metadata?.changed ? "#ff4d4f" : "#fff")
      .attr("stroke-width", d => mergedOptions.highlightChanges && d.metadata?.changed ? 3 : 1);
    
    // Add node labels
    node.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "#000")
      .text(d => d.label);
    
    // Add tooltips
    node.append("title")
      .text(d => getNodeTooltip(d));
    
    // Update positions during simulation
    simulation.nodes(graphData.nodes)
      .on("tick", () => {
        link
          .attr("x1", d => (d.source as any).x)
          .attr("y1", d => (d.source as any).y)
          .attr("x2", d => (d.target as any).x)
          .attr("y2", d => (d.target as any).y);
        
        edgeLabels
          .attr("x", d => ((d.source as any).x + (d.target as any).x) / 2)
          .attr("y", d => ((d.source as any).y + (d.target as any).y) / 2);
        
        node
          .attr("transform", d => `translate(${d.x},${d.y})`);
      });
    
    (simulation.force("link") as d3.ForceLink<GraphNode, GraphEdge>)
      .links(graphData.edges);
    
    // Drag functions
    function dragstarted(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      // TypeScript now knows these properties can exist on GraphNode
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Helper functions
    function getNodeRadius(node: GraphNode): number {
      switch (node.type) {
        case 'primitive': return 12;
        case 'object': return 15;
        case 'array': return 18;
        case 'function': return 15;
        case 'execution': return 10;
        default: return 12;
      }
    }
    
    function getNodeColor(node: GraphNode): string {
      switch (node.type) {
        case 'primitive': return '#91caff'; // Light blue
        case 'object': return '#b7eb8f';    // Light green
        case 'array': return '#ffccc7';     // Light red
        case 'function': return '#d3adf7';  // Light purple
        case 'execution': return '#ffd666'; // Light yellow
        default: return '#d9d9d9';          // Light gray
      }
    }
    
    function getNodeTooltip(node: GraphNode): string {
      let tooltip = `Type: ${node.type}\nID: ${node.id}`;
      
      if (node.metadata?.size) {
        tooltip += `\nSize: ${node.metadata.size} bytes`;
      }
      
      if (node.type === 'primitive' && mergedOptions.showPrimitiveValues) {
        tooltip += `\nValue: ${node.data}`;
      }
      
      if (node.type === 'object' && mergedOptions.showObjectProperties) {
        tooltip += '\nProperties:';
        const objProps = Object.entries(node.data || {}).slice(0, 5);
        objProps.forEach(([key, value]) => {
          const valueStr = typeof value === 'object' && value !== null 
            ? '[Object]' 
            : String(value).substring(0, 50);
          tooltip += `\n  ${key}: ${valueStr}`;
        });
        if (Object.keys(node.data || {}).length > 5) {
          tooltip += '\n  ...';
        }
      }
      
      if (node.type === 'array' && mergedOptions.showObjectProperties) {
        tooltip += `\nLength: ${node.data?.length || 0}`;
        if (node.data?.length > 0) {
          tooltip += '\nElements:';
          const elements = node.data.slice(0, 5);
          elements.forEach((value: any, index: number) => {
            const valueStr = typeof value === 'object' && value !== null 
              ? '[Object]' 
              : String(value).substring(0, 50);
            tooltip += `\n  [${index}]: ${valueStr}`;
          });
          if (node.data?.length > 5) {
            tooltip += '\n  ...';
          }
        }
      }
      
      return tooltip;
    }
    
    // Initial center and zoom
    svg.call(zoom.transform as any, d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(0.8)
      .translate(-width / 2, -height / 2));
    
  }, [graphData, dimensions, mergedOptions, onNodeClick]);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-hidden rounded-lg"
    >
      <svg 
        ref={svgRef} 
        className="w-full h-full"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      />
    </div>
  );
};

export default GraphVisualizer;
