import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/batch/[id]/cancel
 * Cancel a running batch job
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

    // Check if job can be cancelled
    if (existingJob.status === 'completed' || existingJob.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Batch job is already completed or cancelled' },
        { status: 400 }
      );
    }

    // Update batch job status
    const { error: updateError } = await supabase
      .from('batch_jobs')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', batchJobId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error cancelling batch job:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to cancel batch job' }, { status: 500 });
    }

    // Cancel all pending and running operations
    const { error: cancelOpsError } = await supabase
      .from('batch_operations')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('batch_job_id', batchJobId)
      .in('status', ['pending', 'running']);

    if (cancelOpsError) {
      console.error('Error cancelling operations:', cancelOpsError);
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'batch_job.cancelled',
      resource_type: 'batch_job',
      resource_id: batchJobId,
      metadata: {
        name: existingJob.name,
        previous_status: existingJob.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Batch job cancelled successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/batch/[id]/cancel:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
