'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';
import type {
  NetworkGraphData,
  NetworkGraphOptions,
  NetworkNode,
  NetworkEdge,
} from '@/types/visualizations';

interface NetworkGraphProps {
  data: NetworkGraphData;
  options?: NetworkGraphOptions;
  onNodeClick?: (node: NetworkNode) => void;
  onEdgeClick?: (edge: NetworkEdge) => void;
  className?: string;
}

const DEFAULT_OPTIONS: NetworkGraphOptions = {
  width: 800,
  height: 600,
  enableZoom: true,
  enablePan: true,
  enableDrag: true,
  showLabels: true,
  showLegend: true,
  layoutAlgorithm: 'force',
  nodeColors: {
    username: '#3b82f6',
    email: '#10b981',
    domain: '#8b5cf6',
    phone: '#f59e0b',
    image: '#ec4899',
    other: '#6b7280',
  },
};

export function NetworkGraph({
  data,
  options = {},
  onNodeClick,
  onEdgeClick,
  className,
}: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // Update dimensions on resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      setDimensions({
        width: mergedOptions.width || rect.width,
        height: mergedOptions.height || 600,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [mergedOptions.width, mergedOptions.height]);

  // Render the network graph using SVG
  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = svgRef.current;
    const { width, height } = dimensions;

    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Create main group for transformations
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'graph-content');
    svg.appendChild(g);

    // Simple force-directed layout simulation
    const nodeMap = new Map(data.nodes.map((n) => [n.id, { ...n, x: 0, y: 0, vx: 0, vy: 0 }]));

    // Initialize positions
    data.nodes.forEach((node, i) => {
      const angle = (i / data.nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.3;
      const n = nodeMap.get(node.id)!;
      n.x = width / 2 + radius * Math.cos(angle);
      n.y = height / 2 + radius * Math.sin(angle);
    });

    // Create edges
    const edgesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    edgesGroup.setAttribute('class', 'edges');
    g.appendChild(edgesGroup);

    data.edges.forEach((edge) => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(source.x));
      line.setAttribute('y1', String(source.y));
      line.setAttribute('x2', String(target.x));
      line.setAttribute('y2', String(target.y));
      line.setAttribute('stroke', '#94a3b8');
      line.setAttribute('stroke-width', String(edge.weight || 1));
      line.setAttribute('stroke-opacity', '0.6');
      line.setAttribute('class', 'edge');
      line.style.cursor = 'pointer';

      line.addEventListener('click', () => {
        onEdgeClick?.(edge);
      });

      edgesGroup.appendChild(line);
    });

    // Create nodes
    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodesGroup.setAttribute('class', 'nodes');
    g.appendChild(nodesGroup);

    data.nodes.forEach((node) => {
      const n = nodeMap.get(node.id)!;
      const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      nodeGroup.setAttribute('class', 'node');
      nodeGroup.setAttribute('transform', `translate(${n.x},${n.y})`);

      // Node circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', String(node.size || 8));
      circle.setAttribute('fill', node.color || mergedOptions.nodeColors![node.type] || '#6b7280');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      circle.style.cursor = 'pointer';

      // Node label
      if (mergedOptions.showLabels) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '0');
        text.setAttribute('y', '20');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', '#1e293b');
        text.textContent = node.label;
        nodeGroup.appendChild(text);
      }

      // Event handlers
      circle.addEventListener('click', () => {
        setSelectedNode(node);
        onNodeClick?.(node);
      });

      circle.addEventListener('mouseenter', () => {
        circle.setAttribute('stroke-width', '3');
        circle.setAttribute('filter', 'drop-shadow(0 0 8px rgba(0,0,0,0.3))');
      });

      circle.addEventListener('mouseleave', () => {
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('filter', 'none');
      });

      // Drag functionality
      if (mergedOptions.enableDrag) {
        let isDragging = false;
        let startX = 0;
        let startY = 0;

        circle.addEventListener('mousedown', (e) => {
          isDragging = true;
          startX = e.clientX - n.x;
          startY = e.clientY - n.y;
          e.stopPropagation();
        });

        svg.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          n.x = e.clientX - startX;
          n.y = e.clientY - startY;
          nodeGroup.setAttribute('transform', `translate(${n.x},${n.y})`);

          // Update connected edges
          data.edges.forEach((edge) => {
            if (edge.source === node.id || edge.target === node.id) {
              const source = nodeMap.get(edge.source)!;
              const target = nodeMap.get(edge.target)!;
              const edgeElement = edgesGroup.querySelector(
                `[data-edge="${edge.id}"]`
              ) as SVGLineElement | null;
              if (edgeElement) {
                edgeElement.setAttribute('x1', String(source.x));
                edgeElement.setAttribute('y1', String(source.y));
                edgeElement.setAttribute('x2', String(target.x));
                edgeElement.setAttribute('y2', String(target.y));
              }
            }
          });
        });

        svg.addEventListener('mouseup', () => {
          isDragging = false;
        });
      }

      nodeGroup.appendChild(circle);
      nodesGroup.appendChild(nodeGroup);
    });

    // Store edge references
    edgesGroup.querySelectorAll('.edge').forEach((edge, i) => {
      (edge as SVGLineElement).setAttribute('data-edge', data.edges[i].id);
    });
  }, [data, dimensions, mergedOptions, onNodeClick, onEdgeClick]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
  };

  const handleExport = () => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'network-graph.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Network Graph</CardTitle>
            <CardDescription>
              {data.nodes.length} nodes, {data.edges.length} connections
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {mergedOptions.enableZoom && (
              <>
                <Button variant="outline" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleReset}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="outline" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div ref={containerRef} className="flex-1 border rounded-lg overflow-hidden bg-slate-50">
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              className="transition-transform"
            />
          </div>

          {mergedOptions.showLegend && (
            <div className="w-48 space-y-2">
              <div className="text-sm font-semibold mb-2">Legend</div>
              {Object.entries(mergedOptions.nodeColors!).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm capitalize">{type}</span>
                </div>
              ))}

              {selectedNode && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-semibold mb-2">Selected Node</div>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="font-medium">Label:</span> {selectedNode.label}
                    </div>
                    <div>
                      <Badge variant="outline">{selectedNode.type}</Badge>
                    </div>
                    {selectedNode.value && (
                      <div>
                        <span className="font-medium">Value:</span> {selectedNode.value}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
