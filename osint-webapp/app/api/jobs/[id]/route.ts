/**
 * Job Detail API Routes
 * GET /api/jobs/[id] - Get job status
 * DELETE /api/jobs/[id] - Cancel job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getJobStatus, removeJob } from '@/lib/queue/jobQueue';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  formatErrorResponse,
  logError,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/database.types';

/**
 * GET /api/jobs/[id]
 * Get job status and details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    const { id } = await params;

    // Get job from database
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single<Database['public']['Tables']['jobs']['Row']>();

    if (error || !job) {
      throw new NotFoundError('Job');
    }

    // Check authorization
    if (job.user_id !== user.id) {
      throw new AuthorizationError('You do not have access to this job');
    }

    // Get queue status if job is active
    let queueStatus = null;
    if (job.status === 'pending' || job.status === 'running') {
      try {
        queueStatus = await getJobStatus(id);
      } catch (err) {
        logger.warn('Failed to get queue status', { jobId: id, error: err });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...job,
        queueStatus,
      },
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
 * DELETE /api/jobs/[id]
 * Cancel a job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    const { id } = await params;

    // Get job from database
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single<Database['public']['Tables']['jobs']['Row']>();

    if (error || !job) {
      throw new NotFoundError('Job');
    }

    // Check authorization
    if (job.user_id !== user.id) {
      throw new AuthorizationError('You do not have access to this job');
    }

    // Check if job can be cancelled
    if (job.status === 'completed' || job.status === 'cancelled') {
      throw new Error('Job cannot be cancelled');
    }

    logger.info('Cancelling job', { jobId: id, userId: user.id });

    // Remove from queue
    try {
      await removeJob(id);
    } catch (err) {
      logger.warn('Failed to remove job from queue', { jobId: id, error: err });
    }

    // Update database
    const { error: updateError } = await (supabase
      .from('jobs') as any)
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      logger.error('Failed to update job status', updateError);
      throw new Error('Failed to cancel job');
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'job_cancelled',
      resource_type: 'job',
      resource_id: id,
    } as any);

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully',
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
