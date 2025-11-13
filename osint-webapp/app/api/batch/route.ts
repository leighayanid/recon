import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Validation schemas
const createBatchJobSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  investigation_id: z.string().uuid().optional(),
  operations: z.array(
    z.object({
      tool_name: z.string(),
      input_data: z.record(z.any()),
      priority: z.number().int().min(0).max(10).optional(),
      metadata: z.record(z.any()).optional(),
    })
  ).min(1),
  options: z.object({
    execute_parallel: z.boolean().optional(),
    max_parallel: z.number().int().min(1).max(10).optional(),
    stop_on_error: z.boolean().optional(),
    timeout_per_operation_ms: z.number().int().min(1000).optional(),
    retry_failed: z.boolean().optional(),
    max_retries: z.number().int().min(0).max(5).optional(),
  }).optional(),
});

/**
 * GET /api/batch
 * List batch jobs for the authenticated user
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const investigation_id = searchParams.get('investigationId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('batch_jobs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (investigation_id) {
      query = query.eq('investigation_id', investigation_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: batchJobs, error, count } = await query;

    if (error) {
      console.error('Error fetching batch jobs:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch batch jobs' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        batch_jobs: batchJobs,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: count ? offset + limit < count : false,
        },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/batch:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/batch
 * Create a new batch job
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createBatchJobSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, description, investigation_id, operations, options } = validationResult.data;

    // Create batch job
    const batchJobId = uuidv4();
    const { data: batchJob, error: batchJobError } = await supabase
      .from('batch_jobs')
      .insert({
        id: batchJobId,
        user_id: user.id,
        name,
        description,
        investigation_id,
        total_operations: operations.length,
        status: 'pending',
        options: options || {},
        metadata: {},
      })
      .select()
      .single();

    if (batchJobError) {
      console.error('Error creating batch job:', batchJobError);
      return NextResponse.json({ success: false, error: 'Failed to create batch job' }, { status: 500 });
    }

    // Create batch operations
    const batchOperations = operations.map((op) => ({
      id: uuidv4(),
      batch_job_id: batchJobId,
      tool_name: op.tool_name,
      input_data: op.input_data,
      status: 'pending',
      priority: op.priority || 0,
      metadata: op.metadata || {},
    }));

    const { error: operationsError } = await supabase
      .from('batch_operations')
      .insert(batchOperations);

    if (operationsError) {
      console.error('Error creating batch operations:', operationsError);
      // Rollback: delete the batch job
      await supabase.from('batch_jobs').delete().eq('id', batchJobId);
      return NextResponse.json({ success: false, error: 'Failed to create batch operations' }, { status: 500 });
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'batch_job.created',
      resource_type: 'batch_job',
      resource_id: batchJobId,
      metadata: {
        name,
        total_operations: operations.length,
      },
    });

    // TODO: Trigger batch processing worker
    // This would be handled by a background job queue worker

    return NextResponse.json({
      success: true,
      data: {
        batch_job: batchJob,
        operations_count: operations.length,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/batch:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
