/**
 * Phone Search API Route
 * Handles PhoneInfoga phone investigation requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { phoneinfogaInputSchema } from '@/lib/tools/validators/phoneinfogaValidator';
import { addJob } from '@/lib/queue/jobQueue';
import { logUsage } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = phoneinfogaInputSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const inputData = validationResult.data;

    // Create job in database
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        tool_name: 'phoneinfoga',
        status: 'pending',
        input_data: inputData,
        progress: 0,
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Failed to create job:', jobError);
      return NextResponse.json(
        { success: false, error: 'Failed to create job' },
        { status: 500 }
      );
    }

    // Add job to queue
    try {
      await addJob({
        userId: user.id,
        toolName: 'phoneinfoga',
        inputData,
      });
    } catch (queueError) {
      console.error('Failed to add job to queue:', queueError);
      // Update job status to failed
      await supabase
        .from('jobs')
        .update({ status: 'failed', error_message: 'Failed to queue job' })
        .eq('id', job.id);

      return NextResponse.json(
        { success: false, error: 'Failed to queue job' },
        { status: 500 }
      );
    }

    // Log usage
    await logUsage(user.id, 'phoneinfoga', 'search', {
      phoneNumber: inputData.phoneNumber,
    });

    // Return job details
    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        createdAt: job.created_at,
      },
    });
  } catch (error) {
    console.error('Phone search error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
