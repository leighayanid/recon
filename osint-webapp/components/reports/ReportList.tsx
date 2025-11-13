'use client';

/**
 * ReportList Component
 * Displays a list of reports in a grid layout
 */

import { FileText, Calendar, Download, Share2, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { ReportWithInvestigation } from '@/types/reports';

interface ReportListProps {
  reports: ReportWithInvestigation[];
}

export function ReportList({ reports }: ReportListProps) {
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async (reportId: string, reportName: string) => {
    if (!confirm(`Are you sure you want to delete "${reportName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      toast({
        title: 'Report deleted',
        description: `"${reportName}" has been deleted successfully.`,
      });

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

  const handleDownload = (reportId: string, reportName: string, format: string) => {
    window.open(`/api/reports/${reportId}/export?format=${format}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reports.map((report) => (
        <div
          key={report.id}
          className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/reports/${report.id}`}
                  className="font-semibold hover:underline truncate block"
                >
                  {report.name}
                </Link>
                {report.investigation && (
                  <Link
                    href={`/investigations/${report.investigation.id}`}
                    className="text-sm text-muted-foreground hover:underline truncate block"
                  >
                    {report.investigation.name}
                  </Link>
                )}
              </div>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  •••
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/reports/${report.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Report
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDownload(report.id, report.name, 'pdf')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDownload(report.id, report.name, 'json')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDownload(report.id, report.name, 'csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDelete(report.id, report.name)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {report.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {report.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mb-4">
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

          {/* Footer */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDistanceToNow(new Date(report.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
