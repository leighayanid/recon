'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { ChartType, ChartData, ChartOptions } from '@/types/visualizations';

interface DataChartProps {
  type: ChartType;
  data: ChartData;
  options?: ChartOptions;
  onDataPointClick?: (dataPoint: any) => void;
  className?: string;
}

const DEFAULT_OPTIONS: ChartOptions = {
  width: 600,
  height: 400,
  showLegend: true,
  showGrid: true,
  showTooltip: true,
  responsive: true,
  colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
};

const DEFAULT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export function DataChart({ type, data, options = {}, onDataPointClick, className }: DataChartProps) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const colors = mergedOptions.colors || DEFAULT_COLORS;

  // Transform data for charts
  const transformedData = React.useMemo(() => {
    if (type === 'pie') {
      // For pie charts, flatten all series data
      return data.series.flatMap((series) =>
        series.data.map((point) => ({
          name: point.label,
          value: point.value,
          color: point.color || series.color,
        }))
      );
    }

    // For other charts, merge data from all series
    const allLabels = data.labels || [];
    const mergedData = allLabels.map((label, index) => {
      const dataPoint: any = { name: label };
      data.series.forEach((series) => {
        if (series.data[index]) {
          dataPoint[series.name] = series.data[index].value;
        }
      });
      return dataPoint;
    });

    return mergedData;
  }, [data, type]);

  const handleExport = () => {
    const exportData = JSON.stringify(data, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chart-data-${type}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderChart = () => {
    const chartProps = {
      data: transformedData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case 'bar':
        return (
          <BarChart {...chartProps}>
            {mergedOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" label={{ value: mergedOptions.xAxisLabel, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: mergedOptions.yAxisLabel, angle: -90, position: 'insideLeft' }} />
            {mergedOptions.showTooltip && <Tooltip />}
            {mergedOptions.showLegend && <Legend />}
            {data.series.map((series, index) => (
              <Bar
                key={series.name}
                dataKey={series.name}
                fill={series.color || colors[index % colors.length]}
                onClick={onDataPointClick}
              />
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...chartProps}>
            {mergedOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" label={{ value: mergedOptions.xAxisLabel, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: mergedOptions.yAxisLabel, angle: -90, position: 'insideLeft' }} />
            {mergedOptions.showTooltip && <Tooltip />}
            {mergedOptions.showLegend && <Legend />}
            {data.series.map((series, index) => (
              <Line
                key={series.name}
                type="monotone"
                dataKey={series.name}
                stroke={series.color || colors[index % colors.length]}
                strokeWidth={2}
                onClick={onDataPointClick}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...chartProps}>
            {mergedOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" label={{ value: mergedOptions.xAxisLabel, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: mergedOptions.yAxisLabel, angle: -90, position: 'insideLeft' }} />
            {mergedOptions.showTooltip && <Tooltip />}
            {mergedOptions.showLegend && <Legend />}
            {data.series.map((series, index) => (
              <Area
                key={series.name}
                type="monotone"
                dataKey={series.name}
                fill={series.color || colors[index % colors.length]}
                stroke={series.color || colors[index % colors.length]}
                onClick={onDataPointClick}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={transformedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => entry.name}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              onClick={onDataPointClick}
            >
              {transformedData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </Pie>
            {mergedOptions.showTooltip && <Tooltip />}
            {mergedOptions.showLegend && <Legend />}
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...chartProps}>
            {mergedOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" label={{ value: mergedOptions.xAxisLabel, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: mergedOptions.yAxisLabel, angle: -90, position: 'insideLeft' }} />
            {mergedOptions.showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
            {mergedOptions.showLegend && <Legend />}
            {data.series.map((series, index) => (
              <Scatter
                key={series.name}
                name={series.name}
                data={series.data.map((point) => ({ x: point.label, y: point.value }))}
                fill={series.color || colors[index % colors.length]}
                onClick={onDataPointClick}
              />
            ))}
          </ScatterChart>
        );

      case 'radar':
        return (
          <RadarChart {...chartProps} cx="50%" cy="50%" outerRadius="80%">
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis />
            {mergedOptions.showTooltip && <Tooltip />}
            {mergedOptions.showLegend && <Legend />}
            {data.series.map((series, index) => (
              <Radar
                key={series.name}
                name={series.name}
                dataKey={series.name}
                stroke={series.color || colors[index % colors.length]}
                fill={series.color || colors[index % colors.length]}
                fillOpacity={0.6}
                onClick={onDataPointClick}
              />
            ))}
          </RadarChart>
        );

      default:
        return <div className="text-center text-gray-500">Unsupported chart type</div>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{mergedOptions.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`}</CardTitle>
            <CardDescription>
              {data.series.length} series • {transformedData.length} data points
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={mergedOptions.height || 400}>
          {renderChart()}
        </ResponsiveContainer>

        {/* Data Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Series</div>
              <div className="text-2xl font-bold">{data.series.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Data Points</div>
              <div className="text-2xl font-bold">{transformedData.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Value</div>
              <div className="text-2xl font-bold">
                {transformedData.reduce((sum: number, item: any) => {
                  const values = Object.values(item).filter((v) => typeof v === 'number');
                  return sum + (values.reduce((a: any, b: any) => a + b, 0) as number);
                }, 0).toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Chart Type</div>
              <div className="text-2xl font-bold capitalize">{type}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
