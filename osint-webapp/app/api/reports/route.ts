/**
 * Reports API Routes
 * GET  /api/reports - List user reports
 * POST /api/reports - Create new report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ReportData, ReportWithInvestigation } from '@/types/reports';

// Validation schema for creating reports
const createReportSchema = z.object({
  name: z.string().min(1).max(255),
  investigationId: z.string().uuid(),
  template: z.enum([
    'executive-summary',
    'detailed-technical',
    'investigation-timeline',
    'evidence-collection',
    'custom',
  ]),
  description: z.string().optional(),
  includeRawData: z.boolean().optional().default(false),
  includeSummary: z.boolean().optional().default(true),
  format: z.enum(['pdf', 'json', 'csv', 'html']).optional().default('pdf'),
});

/**
 * GET /api/reports
 * List user's reports with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const investigationId = searchParams.get('investigationId');
    const template = searchParams.get('template');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('reports')
      .select(
        `
        *,
        investigation:investigations(id, name, description, status, tags)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (investigationId) {
      query = query.eq('investigation_id', investigationId);
    }

    if (template) {
      query = query.eq('template', template);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (investigationId) {
      countQuery = countQuery.eq('investigation_id', investigationId);
    }

    if (template) {
      countQuery = countQuery.eq('template', template);
    }

    if (search) {
      countQuery = countQuery.ilike('name', `%${search}%`);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      success: true,
      data: {
        reports,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports
 * Create a new report from an investigation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      name,
      investigationId,
      template,
      description,
      includeRawData,
      includeSummary,
      format,
    } = validation.data;

    // Verify investigation exists and user owns it
    const { data: investigation, error: invError } = await supabase
      .from('investigations')
      .select('*')
      .eq('id', investigationId)
      .eq('user_id', user.id)
      .single();

    if (invError || !investigation) {
      return NextResponse.json(
        { error: 'Investigation not found' },
        { status: 404 }
      );
    }

    // Fetch investigation items with job data
    const { data: items, error: itemsError } = await supabase
      .from('investigation_items')
      .select(
        `
        *,
        job:jobs(*)
      `
      )
      .eq('investigation_id', investigationId);

    if (itemsError) {
      console.error('Error fetching investigation items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch investigation items' },
        { status: 500 }
      );
    }

    // Get user profile for report metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // Build report data
    const reportData: ReportData = {
      title: name,
      description: description || investigation.description || undefined,
      metadata: {
        template,
        generatedAt: new Date().toISOString(),
        generatedBy: profile?.full_name || profile?.email || user.email || 'Unknown',
        investigationId: investigation.id,
        investigationName: investigation.name,
        totalItems: items?.length || 0,
        dateRange: {
          start: investigation.created_at,
          end: new Date().toISOString(),
        },
        toolsUsed: [
          ...new Set(
            items
              ?.map((item: { job: { tool_name: string } }) => item.job?.tool_name)
              .filter(Boolean) || []
          ),
        ] as string[],
      },
      sections: [],
      summary: includeSummary
        ? {
            keyFindings: [],
            recommendations: [],
            conclusion: '',
          }
        : undefined,
    };

    // Add sections based on template
    switch (template) {
      case 'executive-summary':
        reportData.sections = buildExecutiveSummarySections(investigation, items);
        break;
      case 'detailed-technical':
        reportData.sections = buildDetailedTechnicalSections(investigation, items);
        break;
      case 'investigation-timeline':
        reportData.sections = buildTimelineSections(investigation, items);
        break;
      case 'evidence-collection':
        reportData.sections = buildEvidenceCollectionSections(investigation, items);
        break;
      case 'custom':
        reportData.sections = buildCustomSections(investigation, items);
        break;
    }

    // Create report record
    const { data: report, error: createError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        investigation_id: investigationId,
        name,
        description: description || null,
        template,
        format,
        report_data: reportData,
        generation_metadata: {
          includeRawData,
          includeSummary,
          generatedAt: new Date().toISOString(),
          itemCount: items?.length || 0,
        },
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating report:', createError);
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      );
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'report_created',
      resource_type: 'report',
      resource_id: report.id,
      metadata: {
        report_name: name,
        investigation_id: investigationId,
        template,
        format,
      },
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error in POST /api/reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper functions to build report sections based on template
 */

function buildExecutiveSummarySections(
  investigation: { name: string; description: string | null; status: string; tags: string[] },
  items: unknown[]
): ReportData['sections'] {
  return [
    {
      id: 'overview',
      type: 'text',
      title: 'Investigation Overview',
      content: `Investigation "${investigation.name}" contains ${items.length} items and is currently ${investigation.status}.`,
      order: 1,
    },
    {
      id: 'stats',
      type: 'table',
      title: 'Statistics',
      content: {
        headers: ['Metric', 'Value'],
        rows: [
          ['Total Items', items.length.toString()],
          ['Status', investigation.status],
          ['Tags', investigation.tags.join(', ')],
        ],
      },
      order: 2,
    },
  ];
}

function buildDetailedTechnicalSections(
  investigation: { name: string },
  items: unknown[]
): ReportData['sections'] {
  return [
    {
      id: 'technical-details',
      type: 'text',
      title: 'Technical Details',
      content: `Detailed technical analysis of investigation "${investigation.name}" with ${items.length} items.`,
      order: 1,
    },
  ];
}

function buildTimelineSections(
  investigation: { name: string },
  items: unknown[]
): ReportData['sections'] {
  return [
    {
      id: 'timeline',
      type: 'text',
      title: 'Investigation Timeline',
      content: `Timeline of events for investigation "${investigation.name}" with ${items.length} items.`,
      order: 1,
    },
  ];
}

function buildEvidenceCollectionSections(
  investigation: { name: string },
  items: unknown[]
): ReportData['sections'] {
  return [
    {
      id: 'evidence',
      type: 'text',
      title: 'Evidence Collection',
      content: `Evidence collected during investigation "${investigation.name}" with ${items.length} items.`,
      order: 1,
    },
  ];
}

function buildCustomSections(
  investigation: { name: string },
  items: unknown[]
): ReportData['sections'] {
  return [
    {
      id: 'custom',
      type: 'text',
      title: 'Custom Report',
      content: `Custom report for investigation "${investigation.name}" with ${items.length} items.`,
      order: 1,
    },
  ];
}
