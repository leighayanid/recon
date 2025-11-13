/**
 * Types for data visualization components
 */

// Network Graph Types
export interface NetworkNode {
  id: string;
  label: string;
  type: 'username' | 'email' | 'domain' | 'phone' | 'image' | 'other';
  value?: string;
  metadata?: Record<string, any>;
  color?: string;
  size?: number;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'related' | 'found_in' | 'linked_to' | 'same_as' | 'other';
  weight?: number;
  metadata?: Record<string, any>;
}

export interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface NetworkGraphOptions {
  width?: number;
  height?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableDrag?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  nodeColors?: Record<string, string>;
  layoutAlgorithm?: 'force' | 'circular' | 'hierarchical' | 'grid';
}

// Chart Types
export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: ChartType;
}

export interface ChartData {
  labels?: string[];
  series: ChartSeries[];
}

export interface ChartOptions {
  width?: number;
  height?: number;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  colors?: string[];
  responsive?: boolean;
}

// Timeline Visualization
export interface TimelineEvent {
  id: string;
  timestamp: Date | string;
  title: string;
  description?: string;
  type?: 'job' | 'finding' | 'note' | 'other';
  icon?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface TimelineData {
  events: TimelineEvent[];
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface TimelineOptions {
  orientation?: 'horizontal' | 'vertical';
  showDate?: boolean;
  showTime?: boolean;
  groupByDate?: boolean;
  sortOrder?: 'asc' | 'desc';
}

// Heat Map
export interface HeatMapDataPoint {
  x: string | number;
  y: string | number;
  value: number;
  metadata?: Record<string, any>;
}

export interface HeatMapData {
  data: HeatMapDataPoint[];
  xLabels?: string[];
  yLabels?: string[];
}

export interface HeatMapOptions {
  width?: number;
  height?: number;
  title?: string;
  colorScheme?: 'blue' | 'green' | 'red' | 'purple' | 'viridis';
  showValues?: boolean;
  showLegend?: boolean;
}

// Word Cloud
export interface WordCloudItem {
  text: string;
  value: number;
  color?: string;
}

export interface WordCloudData {
  words: WordCloudItem[];
}

export interface WordCloudOptions {
  width?: number;
  height?: number;
  minFontSize?: number;
  maxFontSize?: number;
  fontFamily?: string;
  spiral?: 'archimedean' | 'rectangular';
  colors?: string[];
}

// Sankey Diagram (for data flow visualization)
export interface SankeyNode {
  id: string;
  name: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface SankeyOptions {
  width?: number;
  height?: number;
  nodeWidth?: number;
  nodePadding?: number;
  colors?: string[];
}

// Treemap (for hierarchical data)
export interface TreemapNode {
  name: string;
  value?: number;
  children?: TreemapNode[];
  color?: string;
}

export interface TreemapData {
  name: string;
  children: TreemapNode[];
}

export interface TreemapOptions {
  width?: number;
  height?: number;
  colors?: string[];
  showLabels?: boolean;
}

// General Visualization Props
export interface VisualizationProps {
  data: any;
  options?: any;
  className?: string;
  onNodeClick?: (node: any) => void;
  onEdgeClick?: (edge: any) => void;
  onDataPointClick?: (dataPoint: any) => void;
}

// Export types for batch operations
export interface VisualizationExportOptions {
  format: 'png' | 'svg' | 'pdf' | 'json';
  quality?: number;
  scale?: number;
}
