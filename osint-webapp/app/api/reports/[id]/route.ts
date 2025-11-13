/**
 * Report Detail API Routes
 * GET    /api/reports/[id] - Get report details
 * PATCH  /api/reports/[id] - Update report
 * DELETE /api/reports/[id] - Delete report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for updating reports
const updateReportSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  is_public: z.boolean().optional(),
  expires_at: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/reports/[id]
 * Get report details with investigation data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

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

    // Fetch report with investigation details
    let query = supabase
      .from('reports')
      .select(
        `
        *,
        investigation:investigations(id, name, description, status, tags, created_at, updated_at)
      `
      )
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

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error in GET /api/reports/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reports/[id]
 * Update report details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const validation = updateReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Verify report exists and user owns it
    const { data: existingReport, error: fetchError } = await supabase
      .from('reports')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Update report
    const { data: report, error: updateError } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating report:', updateError);
      return NextResponse.json(
        { error: 'Failed to update report' },
        { status: 500 }
      );
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'report_updated',
      resource_type: 'report',
      resource_id: id,
      metadata: updates,
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error in PATCH /api/reports/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/[id]
 * Delete a report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify report exists and user owns it
    const { data: existingReport, error: fetchError } = await supabase
      .from('reports')
      .select('name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Delete report
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting report:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete report' },
        { status: 500 }
      );
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'report_deleted',
      resource_type: 'report',
      resource_id: id,
      metadata: {
        report_name: existingReport.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/reports/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
