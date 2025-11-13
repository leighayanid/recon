/**
 * Reports List Page
 * Displays all reports created by the user
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FileText, Filter } from 'lucide-react';
import { ReportList } from '@/components/reports/ReportList';
import type { ReportWithInvestigation } from '@/types/reports';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch reports
  const { data: reports, error } = await supabase
    .from('reports')
    .select(
      `
      *,
      investigation:investigations(id, name, description, status, tags)
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching reports:', error);
  }

  // Get statistics
  const { data: stats } = await supabase
    .from('reports')
    .select('id, template, created_at', { count: 'exact' })
    .eq('user_id', user.id);

  const totalReports = stats?.length || 0;
  const reportsThisMonth = stats?.filter((s) => {
    const createdAt = new Date(s.created_at);
    const now = new Date();
    return (
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getFullYear() === now.getFullYear()
    );
  }).length || 0;

  // Template usage
  const templateCounts: Record<string, number> = {};
  stats?.forEach((s) => {
    templateCounts[s.template] = (templateCounts[s.template] || 0) + 1;
  });
  const mostUsedTemplate = Object.keys(templateCounts).length > 0
    ? Object.entries(templateCounts).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reports</h1>
        <p className="text-muted-foreground">
          View and manage your investigation reports
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Reports</p>
              <p className="text-3xl font-bold">{totalReports}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-3xl font-bold">{reportsThisMonth}</p>
            </div>
            <Filter className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Most Used Template</p>
              <p className="text-lg font-semibold">
                {mostUsedTemplate
                  ? mostUsedTemplate
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {reports && reports.length > 0 ? (
        <ReportList reports={reports as ReportWithInvestigation[]} />
      ) : (
        <div className="text-center py-12 bg-card border rounded-lg">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
          <p className="text-muted-foreground mb-4">
            Generate reports from your investigations to see them here
          </p>
        </div>
      )}
    </div>
  );
}
