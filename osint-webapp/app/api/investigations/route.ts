/**
 * Investigations API Routes
 * GET /api/investigations - List user's investigations
 * POST /api/investigations - Create new investigation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  AuthenticationError,
  ValidationError,
  formatErrorResponse,
  logError,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const createInvestigationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/investigations
 * List user's investigations with stats
 */
export async function GET(request: NextRequest) {
  try {
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('investigations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: investigations, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch investigations', error);
      throw new Error('Failed to fetch investigations');
    }

    // Get stats for each investigation
    const investigationsWithStats = await Promise.all(
      (investigations || []).map(async (investigation) => {
        // Count items
        const { count: itemCount } = await supabase
          .from('investigation_items')
          .select('*', { count: 'exact', head: true })
          .eq('investigation_id', investigation.id);

        // Count jobs by status
        const { data: jobStats } = await supabase
          .from('jobs')
          .select('status')
          .eq('user_id', user.id)
          .eq('investigation_id', investigation.id);

        const completedJobs = jobStats?.filter((j) => j.status === 'completed').length || 0;
        const pendingJobs = jobStats?.filter((j) => ['pending', 'running'].includes(j.status)).length || 0;
        const failedJobs = jobStats?.filter((j) => j.status === 'failed').length || 0;

        return {
          ...investigation,
          item_count: itemCount || 0,
          completed_jobs: completedJobs,
          pending_jobs: pendingJobs,
          failed_jobs: failedJobs,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        investigations: investigationsWithStats,
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

/**
 * POST /api/investigations
 * Create a new investigation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createInvestigationSchema.safeParse(body);

    if (!validation.success) {
      throw new ValidationError(
        'Invalid investigation input',
        validation.error.errors
      );
    }

    const { name, description, tags } = validation.data;

    logger.info('Creating investigation', {
      userId: user.id,
      name,
    });

    // Create investigation
    const { data: investigation, error } = await supabase
      .from('investigations')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        tags: tags || [],
        status: 'active',
        metadata: {},
      } as any)
      .select()
      .single();

    if (error || !investigation) {
      logger.error('Failed to create investigation', error);
      throw new Error('Failed to create investigation');
    }

    // Log usage
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'investigation_created',
      resource_type: 'investigation',
      resource_id: investigation.id,
      metadata: { name },
    } as any);

    return NextResponse.json(
      {
        success: true,
        data: investigation,
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
