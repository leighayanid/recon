'use client';

/**
 * ReportBuilder Component
 * Dialog for generating reports from investigations
 */

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { ReportTemplate, ReportFormat } from '@/types/reports';

interface ReportBuilderProps {
  investigationId: string;
  investigationName: string;
}

export function ReportBuilder({
  investigationId,
  investigationName,
}: ReportBuilderProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(`${investigationName} - Report`);
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<ReportTemplate>('executive-summary');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const handleGenerateReport = async () => {
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Report name is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          investigationId,
          template,
          format,
          includeSummary,
          includeRawData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate report');
      }

      const result = await response.json();

      toast({
        title: 'Report generated',
        description: `"${name}" has been created successfully.`,
      });

      setOpen(false);
      router.push(`/reports/${result.data.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>
            Create a comprehensive report from this investigation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Report Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter report name"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select value={template} onValueChange={(v) => setTemplate(v as ReportTemplate)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="executive-summary">Executive Summary</SelectItem>
                <SelectItem value="detailed-technical">Detailed Technical</SelectItem>
                <SelectItem value="investigation-timeline">Investigation Timeline</SelectItem>
                <SelectItem value="evidence-collection">Evidence Collection</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ReportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeSummary"
                checked={includeSummary}
                onChange={(e) => setIncludeSummary(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="includeSummary" className="font-normal cursor-pointer">
                Include Executive Summary
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeRawData"
                checked={includeRawData}
                onChange={(e) => setIncludeRawData(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="includeRawData" className="font-normal cursor-pointer">
                Include Raw Data
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerateReport} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
