'use client';

/**
 * ReportViewer Component
 * Displays report content with export and sharing options
 */

import { useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Download,
  Share2,
  Copy,
  ExternalLink,
  Calendar,
  FileText,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { ReportData, ReportSection } from '@/types/reports';

interface ReportViewerProps {
  report: {
    id: string;
    name: string;
    description: string | null;
    template: string;
    format: string;
    is_public: boolean;
    created_at: string;
    investigation?: {
      id: string;
      name: string;
      description: string | null;
      status: string;
      tags: string[];
    } | null;
  };
  reportData: ReportData;
}

export function ReportViewer({ report, reportData }: ReportViewerProps) {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDownload = (format: string) => {
    window.open(`/api/reports/${report.id}/export?format=${format}`, '_blank');
  };

  const handleToggleShare = async () => {
    setIsSharing(true);
    try {
      const response = await fetch(`/api/reports/${report.id}/share`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublic: !report.is_public,
          expiresAt: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle sharing');
      }

      const result = await response.json();

      if (result.data.publicUrl) {
        // Copy to clipboard
        await navigator.clipboard.writeText(result.data.publicUrl);
        toast({
          title: 'Public link copied',
          description: 'The public link has been copied to your clipboard.',
        });
      } else {
        toast({
          title: 'Sharing disabled',
          description: 'The report is no longer publicly accessible.',
        });
      }

      router.refresh();
    } catch (error) {
      console.error('Error toggling share:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle sharing. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${report.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      toast({
        title: 'Report deleted',
        description: 'The report has been deleted successfully.',
      });

      router.push('/reports');
      router.refresh();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const copyPublicLink = async () => {
    const publicUrl = `${window.location.origin}/reports/${report.id}`;
    await navigator.clipboard.writeText(publicUrl);
    toast({
      title: 'Link copied',
      description: 'The report link has been copied to your clipboard.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/reports"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Link>

        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{report.name}</h1>
            {report.description && (
              <p className="text-muted-foreground">{report.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Download Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDownload('pdf')}>
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('html')}>
                  Export HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('json')}>
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('csv')}>
                  Export CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Share Button */}
            <Button
              variant="outline"
              onClick={handleToggleShare}
              disabled={isSharing}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {report.is_public ? 'Unshare' : 'Share'}
            </Button>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">•••</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {report.is_public && (
                  <>
                    <DropdownMenuItem onClick={copyPublicLink}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Public Link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {report.investigation && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={`/investigations/${report.investigation.id}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Investigation
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}</span>
          </div>
          <Badge variant="outline">
            {report.template
              .split('-')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')}
          </Badge>
          <Badge variant="outline">{report.format.toUpperCase()}</Badge>
          {report.is_public && (
            <Badge variant="secondary">
              <Share2 className="h-3 w-3 mr-1" />
              Public
            </Badge>
          )}
        </div>

        {report.investigation && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Investigation:</span>
              <Link
                href={`/investigations/${report.investigation.id}`}
                className="text-sm text-primary hover:underline"
              >
                {report.investigation.name}
              </Link>
            </div>
            {report.investigation.description && (
              <p className="text-sm text-muted-foreground">
                {report.investigation.description}
              </p>
            )}
          </div>
        )}
      </div>

      <Separator className="my-8" />

      {/* Report Content */}
      <div className="bg-card border rounded-lg p-8">
        {/* Title */}
        <h2 className="text-2xl font-bold mb-4">{reportData.title}</h2>

        {reportData.description && (
          <p className="text-muted-foreground mb-6">{reportData.description}</p>
        )}

        {/* Metadata Section */}
        <div className="bg-muted/50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Report Information</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="font-medium">Generated:</dt>
              <dd className="text-muted-foreground">
                {format(new Date(reportData.metadata.generatedAt), 'MMMM dd, yyyy HH:mm:ss')}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Generated By:</dt>
              <dd className="text-muted-foreground">{reportData.metadata.generatedBy}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Template:</dt>
              <dd className="text-muted-foreground">
                {reportData.metadata.template
                  .split('-')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')}
              </dd>
            </div>
            {reportData.metadata.totalItems !== undefined && (
              <div className="flex justify-between">
                <dt className="font-medium">Total Items:</dt>
                <dd className="text-muted-foreground">{reportData.metadata.totalItems}</dd>
              </div>
            )}
            {reportData.metadata.toolsUsed && reportData.metadata.toolsUsed.length > 0 && (
              <div className="flex justify-between">
                <dt className="font-medium">Tools Used:</dt>
                <dd className="text-muted-foreground">
                  {reportData.metadata.toolsUsed.join(', ')}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Summary */}
        {reportData.summary && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Executive Summary</h3>

            {reportData.summary.keyFindings && reportData.summary.keyFindings.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Key Findings:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {reportData.summary.keyFindings.map((finding, index) => (
                    <li key={index} className="text-muted-foreground">
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.summary.recommendations && reportData.summary.recommendations.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Recommendations:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {reportData.summary.recommendations.map((rec, index) => (
                    <li key={index} className="text-muted-foreground">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.summary.conclusion && (
              <div>
                <h4 className="font-medium mb-2">Conclusion:</h4>
                <p className="text-muted-foreground">{reportData.summary.conclusion}</p>
              </div>
            )}
          </div>
        )}

        {/* Sections */}
        {reportData.sections.map((section) => (
          <div key={section.id} className="mb-8">
            <h3 className="text-xl font-semibold mb-4">{section.title}</h3>
            <ReportSectionContent section={section} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Render section content based on type
 */
function ReportSectionContent({ section }: { section: ReportSection }) {
  switch (section.type) {
    case 'text':
      return <p className="text-muted-foreground">{String(section.content)}</p>;

    case 'table':
      const tableContent = section.content as { headers: string[]; rows: string[][] };
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                {tableContent.headers.map((header, index) => (
                  <th
                    key={index}
                    className="text-left p-3 font-medium bg-muted/50"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableContent.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="p-3 text-muted-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'findings':
      const findings = section.content as Array<Record<string, unknown>>;
      return (
        <div className="space-y-4">
          {findings.map((finding, index) => (
            <div key={index} className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">{String(finding.title || 'Finding')}</h4>
              <p className="text-muted-foreground">{String(finding.description || '')}</p>
            </div>
          ))}
        </div>
      );

    default:
      return (
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
          {JSON.stringify(section.content, null, 2)}
        </pre>
      );
  }
}
