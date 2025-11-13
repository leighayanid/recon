import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/batch/[id]/retry
 * Retry failed operations in a batch job
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get failed operations
    const { data: failedOps, error: opsError } = await supabase
      .from('batch_operations')
      .select('id')
      .eq('batch_job_id', batchJobId)
      .eq('status', 'failed');

    if (opsError) {
      console.error('Error fetching failed operations:', opsError);
      return NextResponse.json({ success: false, error: 'Failed to fetch operations' }, { status: 500 });
    }

    if (!failedOps || failedOps.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No failed operations to retry' },
        { status: 400 }
      );
    }

    // Reset failed operations to pending
    const { error: retryError } = await supabase
      .from('batch_operations')
      .update({
        status: 'pending',
        error_message: null,
        started_at: null,
        completed_at: null,
      })
      .eq('batch_job_id', batchJobId)
      .eq('status', 'failed');

    if (retryError) {
      console.error('Error retrying operations:', retryError);
      return NextResponse.json({ success: false, error: 'Failed to retry operations' }, { status: 500 });
    }

    // Update batch job status
    const { error: updateError } = await supabase
      .from('batch_jobs')
      .update({
        status: 'pending',
        failed_operations: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchJobId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating batch job:', updateError);
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'batch_job.retried',
      resource_type: 'batch_job',
      resource_id: batchJobId,
      metadata: {
        name: existingJob.name,
        retried_count: failedOps.length,
      },
    });

    // TODO: Trigger batch processing worker to process the retried operations

    return NextResponse.json({
      success: true,
      message: `Successfully queued ${failedOps.length} operations for retry`,
      data: {
        retried_count: failedOps.length,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/batch/[id]/retry:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
