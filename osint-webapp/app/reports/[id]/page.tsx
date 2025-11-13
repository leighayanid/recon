/**
 * Report Detail/Viewer Page
 * Display a single report with export and sharing options
 */

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ReportViewer } from '@/components/reports/ReportViewer';
import type { ReportData } from '@/types/reports';

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch report
  const { data: report, error } = await supabase
    .from('reports')
    .select(
      `
      *,
      investigation:investigations(id, name, description, status, tags)
    `
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !report) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ReportViewer
        report={report}
        reportData={report.report_data as ReportData}
      />
    </div>
  );
}
