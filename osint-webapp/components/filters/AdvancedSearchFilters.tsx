'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, X, Search } from 'lucide-react';

export interface FilterOption {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';
  value: any;
  label?: string;
}

export interface AdvancedSearchFiltersProps {
  onFiltersChange: (filters: FilterOption[]) => void;
  onSearch: () => void;
  onClear: () => void;
  availableFields: { value: string; label: string; type: 'text' | 'number' | 'date' | 'select'; options?: string[] }[];
  className?: string;
}

export function AdvancedSearchFilters({
  onFiltersChange,
  onSearch,
  onClear,
  availableFields,
  className,
}: AdvancedSearchFiltersProps) {
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [currentFilter, setCurrentFilter] = useState<Partial<FilterOption>>({
    field: '',
    operator: 'equals',
    value: '',
  });

  const operatorOptions = {
    text: [
      { value: 'equals', label: 'Equals' },
      { value: 'contains', label: 'Contains' },
      { value: 'starts_with', label: 'Starts with' },
      { value: 'ends_with', label: 'Ends with' },
    ],
    number: [
      { value: 'equals', label: 'Equals' },
      { value: 'gt', label: 'Greater than' },
      { value: 'lt', label: 'Less than' },
      { value: 'gte', label: 'Greater than or equal' },
      { value: 'lte', label: 'Less than or equal' },
    ],
    date: [
      { value: 'equals', label: 'On' },
      { value: 'gt', label: 'After' },
      { value: 'lt', label: 'Before' },
      { value: 'between', label: 'Between' },
    ],
    select: [
      { value: 'equals', label: 'Is' },
      { value: 'in', label: 'Is any of' },
    ],
  };

  const selectedField = availableFields.find((f) => f.value === currentFilter.field);
  const availableOperators = selectedField ? operatorOptions[selectedField.type] : [];

  const handleAddFilter = () => {
    if (!currentFilter.field || !currentFilter.operator || !currentFilter.value) {
      return;
    }

    const newFilter: FilterOption = {
      field: currentFilter.field,
      operator: currentFilter.operator as FilterOption['operator'],
      value: currentFilter.value,
      label: selectedField?.label,
    };

    const updatedFilters = [...filters, newFilter];
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);

    // Reset current filter
    setCurrentFilter({
      field: '',
      operator: 'equals',
      value: '',
    });
  };

  const handleRemoveFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleClearAll = () => {
    setFilters([]);
    setCurrentFilter({
      field: '',
      operator: 'equals',
      value: '',
    });
    onFiltersChange([]);
    onClear();
  };

  const getOperatorLabel = (operator: string) => {
    const allOperators = Object.values(operatorOptions).flat();
    return allOperators.find((op) => op.value === operator)?.label || operator;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
            <CardDescription>Add multiple filters to refine your search</CardDescription>
          </div>
          {filters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Filters */}
        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-4 border-b">
            {filters.map((filter, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-2 px-3 py-1">
                <span className="font-medium">{filter.label || filter.field}</span>
                <span className="text-gray-500">{getOperatorLabel(filter.operator)}</span>
                <span>{String(filter.value)}</span>
                <button
                  onClick={() => handleRemoveFilter(index)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add New Filter */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Field Selection */}
            <div className="space-y-2">
              <Label htmlFor="field">Field</Label>
              <Select
                value={currentFilter.field}
                onValueChange={(value) => {
                  setCurrentFilter({ ...currentFilter, field: value, operator: 'equals', value: '' });
                }}
              >
                <SelectTrigger id="field">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Operator Selection */}
            <div className="space-y-2">
              <Label htmlFor="operator">Operator</Label>
              <Select
                value={currentFilter.operator}
                onValueChange={(value) => setCurrentFilter({ ...currentFilter, operator: value as any })}
                disabled={!currentFilter.field}
              >
                <SelectTrigger id="operator">
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  {availableOperators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value Input */}
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              {selectedField?.type === 'select' && selectedField.options ? (
                <Select value={currentFilter.value} onValueChange={(value) => setCurrentFilter({ ...currentFilter, value })}>
                  <SelectTrigger id="value">
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedField.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : selectedField?.type === 'date' ? (
                <Input
                  id="value"
                  type="date"
                  value={currentFilter.value}
                  onChange={(e) => setCurrentFilter({ ...currentFilter, value: e.target.value })}
                  disabled={!currentFilter.field}
                />
              ) : selectedField?.type === 'number' ? (
                <Input
                  id="value"
                  type="number"
                  value={currentFilter.value}
                  onChange={(e) => setCurrentFilter({ ...currentFilter, value: e.target.value })}
                  placeholder="Enter value"
                  disabled={!currentFilter.field}
                />
              ) : (
                <Input
                  id="value"
                  type="text"
                  value={currentFilter.value}
                  onChange={(e) => setCurrentFilter({ ...currentFilter, value: e.target.value })}
                  placeholder="Enter value"
                  disabled={!currentFilter.field}
                />
              )}
            </div>
          </div>

          <Button onClick={handleAddFilter} disabled={!currentFilter.field || !currentFilter.value} className="w-full">
            Add Filter
          </Button>
        </div>

        {/* Search Button */}
        <div className="pt-4 border-t">
          <Button onClick={onSearch} className="w-full" size="lg">
            <Search className="h-4 w-4 mr-2" />
            Apply Filters {filters.length > 0 && `(${filters.length})`}
          </Button>
        </div>

        {/* Filter Summary */}
        {filters.length > 0 && (
          <div className="text-sm text-gray-500 text-center">
            {filters.length} filter{filters.length !== 1 ? 's' : ''} active
          </div>
        )}
      </CardContent>
    </Card>
  );
}
