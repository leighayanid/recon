/**
 * Report Export API Routes
 * GET /api/reports/[id]/export?format=pdf|json|csv|html
 * Download report in various formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePDF } from '@/lib/reports/pdfGenerator';
import {
  exportToJSON,
  exportToCSV,
  exportToHTML,
} from '@/lib/reports/exporters';
import type { ReportData } from '@/types/reports';
import slugify from 'slugify';

/**
 * GET /api/reports/[id]/export
 * Export report in specified format
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get format from query params (default to PDF)
    const format = request.nextUrl.searchParams.get('format') || 'pdf';

    if (!['pdf', 'json', 'csv', 'html'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be pdf, json, csv, or html' },
        { status: 400 }
      );
    }

    // Check if report is public (allow unauthenticated access)
    const { data: publicReport } = await supabase
      .from('reports')
      .select('is_public, expires_at')
      .eq('id', id)
      .single();

    let userId: string | null = null;

    // If not public, require authentication
    if (!publicReport?.is_public) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    } else {
      // Check if public link has expired
      if (publicReport.expires_at) {
        const expiresAt = new Date(publicReport.expires_at);
        if (expiresAt < new Date()) {
          return NextResponse.json(
            { error: 'Public link has expired' },
            { status: 403 }
          );
        }
      }
    }

    // Fetch report
    let query = supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    // If authenticated, verify ownership
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: report, error } = await query;

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const reportData = report.report_data as ReportData;

    // Generate filename
    const filename = slugify(report.name, { lower: true, strict: true });

    // Export based on format
    switch (format) {
      case 'pdf':
        return await exportAsPDF(reportData, filename);
      case 'json':
        return exportAsJSON(reportData, filename);
      case 'csv':
        return exportAsCSV(reportData, filename);
      case 'html':
        return exportAsHTML(reportData, filename);
      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in GET /api/reports/[id]/export:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}

/**
 * Export as PDF
 */
async function exportAsPDF(reportData: ReportData, filename: string) {
  try {
    const pdfBuffer = await generatePDF(reportData);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Export as JSON
 */
function exportAsJSON(reportData: ReportData, filename: string) {
  const json = exportToJSON(reportData);

  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}.json"`,
      'Cache-Control': 'no-cache',
    },
  });
}

/**
 * Export as CSV
 */
function exportAsCSV(reportData: ReportData, filename: string) {
  const csv = exportToCSV(reportData);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
      'Cache-Control': 'no-cache',
    },
  });
}

/**
 * Export as HTML
 */
function exportAsHTML(reportData: ReportData, filename: string) {
  const html = exportToHTML(reportData);

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="${filename}.html"`,
      'Cache-Control': 'no-cache',
    },
  });
}
