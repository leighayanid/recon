/**
 * Report Sharing API Routes
 * PATCH /api/reports/[id]/share - Toggle public sharing and set expiration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for sharing
const shareReportSchema = z.object({
  isPublic: z.boolean(),
  expiresAt: z.string().datetime().optional().nullable(),
});

/**
 * PATCH /api/reports/[id]/share
 * Toggle public sharing for a report
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
    const validation = shareReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { isPublic, expiresAt } = validation.data;

    // Verify report exists and user owns it
    const { data: existingReport, error: fetchError } = await supabase
      .from('reports')
      .select('name, is_public')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Validate expiration date
    if (expiresAt) {
      const expirationDate = new Date(expiresAt);
      if (expirationDate <= new Date()) {
        return NextResponse.json(
          { error: 'Expiration date must be in the future' },
          { status: 400 }
        );
      }
    }

    // Update sharing settings
    const { data: report, error: updateError } = await supabase
      .from('reports')
      .update({
        is_public: isPublic,
        expires_at: expiresAt || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating report sharing:', updateError);
      return NextResponse.json(
        { error: 'Failed to update sharing settings' },
        { status: 500 }
      );
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: isPublic ? 'report_shared' : 'report_unshared',
      resource_type: 'report',
      resource_id: id,
      metadata: {
        report_name: existingReport.name,
        is_public: isPublic,
        expires_at: expiresAt || null,
      },
    });

    // Generate public URL if report is public
    let publicUrl = null;
    if (isPublic) {
      const baseUrl = request.nextUrl.origin;
      publicUrl = `${baseUrl}/reports/${id}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        report,
        publicUrl,
      },
    });
  } catch (error) {
    console.error('Error in PATCH /api/reports/[id]/share:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
