/**
 * Jobs API Routes
 * POST /api/jobs - Create new job
 * GET /api/jobs - List user's jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addJob } from '@/lib/queue/jobQueue';
import { rateLimitByUser, addRateLimitHeaders } from '@/lib/middleware/rateLimit';
import {
  ValidationError,
  AuthenticationError,
  formatErrorResponse,
  logError,
} from '@/lib/utils/errors';
import { validateInput, jobInputSchema } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import type { ToolName } from '@/lib/queue/types';
import type { Database } from '@/types/database.types';

/**
 * POST /api/jobs
 * Create a new job
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    // Get user profile for role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    const userRole = (profile?.role || 'user') as 'user' | 'pro' | 'admin';

    // Check rate limit
    const rateLimitInfo = await rateLimitByUser(user.id, userRole, 'tool');

    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = validateInput(jobInputSchema, body);
    if (!validation.success) {
      throw new ValidationError('Invalid job input', validation.errors);
    }

    const { toolName, inputData, investigationId, priority } = validation.data;

    logger.info('Creating job', {
      userId: user.id,
      toolName,
      investigationId,
    });

    // Create job in database
    const { data: dbJob, error: dbError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        investigation_id: investigationId,
        tool_name: toolName,
        status: 'pending',
        input_data: inputData,
        progress: 0,
        priority: priority || 0,
      } as any)
      .select()
      .single<Database['public']['Tables']['jobs']['Row']>();

    if (dbError || !dbJob) {
      logger.error('Failed to create job in database', dbError);
      throw new Error('Failed to create job');
    }

    // Add job to queue
    try {
      await addJob(
        toolName as ToolName,
        inputData,
        user.id,
        investigationId,
        { priority }
      );

      logger.info('Job added to queue', {
        jobId: dbJob.id,
        toolName,
      });
    } catch (queueError) {
      // Rollback database entry
      await supabase.from('jobs').delete().eq('id', dbJob.id);

      logger.error('Failed to add job to queue', queueError as Error);
      throw new Error('Failed to queue job');
    }

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      tool_name: toolName,
      action: 'job_created',
      metadata: { jobId: dbJob.id },
    } as any);

    // Return response with rate limit headers
    const response = NextResponse.json(
      {
        success: true,
        data: {
          id: dbJob.id,
          toolName: dbJob.tool_name,
          status: dbJob.status,
          progress: dbJob.progress,
          createdAt: dbJob.created_at,
        },
      },
      { status: 201 }
    );

    addRateLimitHeaders(response.headers, rateLimitInfo);
    return response;
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
 * GET /api/jobs
 * List user's jobs
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const toolName = searchParams.get('toolName');
    const investigationId = searchParams.get('investigationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (toolName) {
      query = query.eq('tool_name', toolName);
    }
    if (investigationId) {
      query = query.eq('investigation_id', investigationId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: jobs, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch jobs', error);
      throw new Error('Failed to fetch jobs');
    }

    return NextResponse.json({
      success: true,
      data: {
        jobs: jobs || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
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
