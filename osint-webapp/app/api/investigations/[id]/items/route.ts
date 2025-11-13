/**
 * Investigation Items API Routes
 * POST /api/investigations/[id]/items - Add job to investigation
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

const addItemSchema = z.object({
  job_id: z.string().uuid(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).optional(),
  is_favorite: z.boolean().optional(),
});

/**
 * POST /api/investigations/[id]/items
 * Add a job to an investigation
 */
export async function POST(
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

    const { id: investigationId } = await params;

    // Verify investigation ownership
    const { data: investigation, error: invError } = await supabase
      .from('investigations')
      .select('id')
      .eq('id', investigationId)
      .eq('user_id', user.id)
      .single();

    if (invError || !investigation) {
      throw new NotFoundError('Investigation not found');
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = addItemSchema.safeParse(body);

    if (!validation.success) {
      throw new ValidationError(
        'Invalid item input',
        validation.error.errors
      );
    }

    const { job_id, notes, tags, is_favorite } = validation.data;

    // Verify job ownership
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, tool_name')
      .eq('id', job_id)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      throw new NotFoundError('Job not found');
    }

    logger.info('Adding job to investigation', {
      userId: user.id,
      investigationId,
      jobId: job_id,
    });

    // Check if item already exists
    const { data: existing } = await supabase
      .from('investigation_items')
      .select('id')
      .eq('investigation_id', investigationId)
      .eq('job_id', job_id)
      .single();

    if (existing) {
      throw new ValidationError('Job already added to this investigation');
    }

    // Create investigation item
    const { data: item, error: itemError } = await supabase
      .from('investigation_items')
      .insert({
        investigation_id: investigationId,
        job_id,
        notes: notes || null,
        tags: tags || [],
        is_favorite: is_favorite || false,
      } as any)
      .select(`
        *,
        job:jobs(*)
      `)
      .single();

    if (itemError || !item) {
      logger.error('Failed to create investigation item', itemError);
      throw new Error('Failed to add job to investigation');
    }

    // Update job with investigation_id if not set
    await supabase
      .from('jobs')
      .update({ investigation_id: investigationId } as any)
      .eq('id', job_id)
      .is('investigation_id', null);

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'investigation_item_added',
      resource_type: 'investigation_item',
      resource_id: item.id,
      metadata: { investigationId, jobId: job_id },
    } as any);

    return NextResponse.json(
      {
        success: true,
        data: item,
      },
      { status: 201 }
    );
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
