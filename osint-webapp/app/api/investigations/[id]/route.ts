/**
 * Single Investigation API Routes
 * GET /api/investigations/[id] - Get investigation details
 * PATCH /api/investigations/[id] - Update investigation
 * DELETE /api/investigations/[id] - Delete investigation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  formatErrorResponse,
  logError,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const updateInvestigationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/investigations/[id]
 * Get investigation details with items and stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    const { id } = await params;

    // Get investigation
    const { data: investigation, error } = await supabase
      .from('investigations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !investigation) {
      throw new NotFoundError('Investigation not found');
    }

    // Get investigation items with jobs
    const { data: items, error: itemsError } = await supabase
      .from('investigation_items')
      .select(`
        *,
        job:jobs(*)
      `)
      .eq('investigation_id', id)
      .order('created_at', { ascending: false });

    if (itemsError) {
      logger.error('Failed to fetch investigation items', itemsError);
      throw new Error('Failed to fetch investigation items');
    }

    // Calculate stats
    const allJobs = items?.map((item: any) => item.job).filter(Boolean) || [];
    const completedJobs = allJobs.filter((j: any) => j.status === 'completed').length;
    const pendingJobs = allJobs.filter((j: any) => ['pending', 'running'].includes(j.status)).length;
    const failedJobs = allJobs.filter((j: any) => j.status === 'failed').length;

    const detail = {
      ...investigation,
      items: items || [],
      stats: {
        total_items: items?.length || 0,
        completed_jobs: completedJobs,
        pending_jobs: pendingJobs,
        failed_jobs: failedJobs,
      },
    };

    return NextResponse.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    logError(error as Error);
    const errorResponse = formatErrorResponse(
      error as Error,
      process.env.NODE_ENV === 'development'
    );

    const statusCode =
      error instanceof Error && 'statusCode' in error
        ? (error as any).statusCode
        : 500;

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * PATCH /api/investigations/[id]
 * Update investigation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    const { id } = await params;

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('investigations')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundError('Investigation not found');
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateInvestigationSchema.safeParse(body);

    if (!validation.success) {
      throw new ValidationError(
        'Invalid investigation update',
        validation.error.errors
      );
    }

    const updates = validation.data;

    logger.info('Updating investigation', {
      userId: user.id,
      investigationId: id,
      updates,
    });

    // Update investigation
    const { data: updated, error: updateError } = await supabase
      .from('investigations')
      .update(updates as any)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !updated) {
      logger.error('Failed to update investigation', updateError);
      throw new Error('Failed to update investigation');
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'investigation_updated',
      resource_type: 'investigation',
      resource_id: id,
      metadata: updates,
    } as any);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logError(error as Error);
    const errorResponse = formatErrorResponse(
      error as Error,
      process.env.NODE_ENV === 'development'
    );

    const statusCode =
      error instanceof Error && 'statusCode' in error
        ? (error as any).statusCode
        : 500;

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * DELETE /api/investigations/[id]
 * Delete investigation (cascade deletes items)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    const { id } = await params;

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('investigations')
      .select('name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundError('Investigation not found');
    }

    logger.info('Deleting investigation', {
      userId: user.id,
      investigationId: id,
    });

    // Delete investigation (cascade will handle items)
    const { error: deleteError } = await supabase
      .from('investigations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      logger.error('Failed to delete investigation', deleteError);
      throw new Error('Failed to delete investigation');
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'investigation_deleted',
      resource_type: 'investigation',
      resource_id: id,
      metadata: { name: existing.name },
    } as any);

    return NextResponse.json({
      success: true,
      message: 'Investigation deleted successfully',
    });
  } catch (error) {
    logError(error as Error);
    const errorResponse = formatErrorResponse(
      error as Error,
      process.env.NODE_ENV === 'development'
    );

    const statusCode =
      error instanceof Error && 'statusCode' in error
        ? (error as any).statusCode
        : 500;

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
