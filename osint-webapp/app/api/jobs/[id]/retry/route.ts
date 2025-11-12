/**
 * Job Retry API Route
 * POST /api/jobs/[id]/retry - Retry a failed job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { retryJob } from '@/lib/queue/jobQueue';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  formatErrorResponse,
  logError,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/jobs/[id]/retry
 * Retry a failed job
 */
export async function POST(
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
      .single();

    if (error || !job) {
      throw new NotFoundError('Job');
    }

    // Check authorization
    if (job.user_id !== user.id) {
      throw new AuthorizationError('You do not have access to this job');
    }

    // Check if job can be retried
    if (job.status !== 'failed') {
      throw new Error('Only failed jobs can be retried');
    }

    logger.info('Retrying job', { jobId: id, userId: user.id });

    // Retry job in queue
    try {
      await retryJob(id);
    } catch (err) {
      logger.error('Failed to retry job in queue', err);
      throw new Error('Failed to retry job');
    }

    // Update database
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'pending',
        error_message: null,
        progress: 0,
      })
      .eq('id', id);

    if (updateError) {
      logger.error('Failed to update job status', updateError);
      throw new Error('Failed to update job');
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'job_retried',
      resource_type: 'job',
      resource_id: id,
    });

    return NextResponse.json({
      success: true,
      message: 'Job queued for retry',
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
