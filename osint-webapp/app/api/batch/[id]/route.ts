import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const updateBatchJobSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
});

/**
 * GET /api/batch/[id]
 * Get batch job details with operations
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const batchJobId = params.id;

    // Get batch job
    const { data: batchJob, error: batchJobError } = await supabase
      .from('batch_jobs')
      .select('*')
      .eq('id', batchJobId)
      .eq('user_id', user.id)
      .single();

    if (batchJobError || !batchJob) {
      return NextResponse.json({ success: false, error: 'Batch job not found' }, { status: 404 });
    }

    // Get batch operations
    const { data: operations, error: operationsError } = await supabase
      .from('batch_operations')
      .select('*')
      .eq('batch_job_id', batchJobId)
      .order('created_at', { ascending: true });

    if (operationsError) {
      console.error('Error fetching batch operations:', operationsError);
      return NextResponse.json({ success: false, error: 'Failed to fetch operations' }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      total: operations.length,
      pending: operations.filter((op) => op.status === 'pending').length,
      running: operations.filter((op) => op.status === 'running').length,
      completed: operations.filter((op) => op.status === 'completed').length,
      failed: operations.filter((op) => op.status === 'failed').length,
      cancelled: operations.filter((op) => op.status === 'cancelled').length,
      avg_execution_time_ms: operations
        .filter((op) => op.execution_time_ms)
        .reduce((sum, op) => sum + (op.execution_time_ms || 0), 0) / operations.filter((op) => op.execution_time_ms).length || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        batch_job: batchJob,
        operations,
        stats,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/batch/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/batch/[id]
 * Update batch job details
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const batchJobId = params.id;

    // Verify ownership
    const { data: existingJob, error: fetchError } = await supabase
      .from('batch_jobs')
      .select('*')
      .eq('id', batchJobId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingJob) {
      return NextResponse.json({ success: false, error: 'Batch job not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateBatchJobSchema.safeParse(body);

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

    const updates = validationResult.data;

    // Update batch job
    const { data: updatedJob, error: updateError } = await supabase
      .from('batch_jobs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchJobId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating batch job:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to update batch job' }, { status: 500 });
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'batch_job.updated',
      resource_type: 'batch_job',
      resource_id: batchJobId,
      metadata: updates,
    });

    return NextResponse.json({
      success: true,
      data: updatedJob,
    });
  } catch (error) {
    console.error('Error in PATCH /api/batch/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/batch/[id]
 * Delete a batch job and its operations
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const batchJobId = params.id;

    // Verify ownership and check if job is not running
    const { data: existingJob, error: fetchError } = await supabase
      .from('batch_jobs')
      .select('*')
      .eq('id', batchJobId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingJob) {
      return NextResponse.json({ success: false, error: 'Batch job not found' }, { status: 404 });
    }

    if (existingJob.status === 'processing') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete a batch job that is currently processing' },
        { status: 400 }
      );
    }

    // Delete batch job (operations will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('batch_jobs')
      .delete()
      .eq('id', batchJobId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting batch job:', deleteError);
      return NextResponse.json({ success: false, error: 'Failed to delete batch job' }, { status: 500 });
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'batch_job.deleted',
      resource_type: 'batch_job',
      resource_id: batchJobId,
      metadata: {
        name: existingJob.name,
        status: existingJob.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Batch job deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/batch/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
