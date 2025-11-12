/**
 * Tool Worker
 * BullMQ worker for processing OSINT tool jobs
 */

import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../connection';
import type { JobData, JobResult, WorkerOptions } from '../types';
import { createAdminClient } from '@/lib/supabase/server';
import { ToolExecutor } from '@/lib/tools/base/ToolExecutor';
import { getToolExecutor } from '@/lib/tools/registry';
import type { Database } from '@/types/database.types';

const QUEUE_NAME = 'osint-tools';

let worker: Worker<JobData, JobResult> | null = null;

/**
 * Process a single job
 */
async function processJob(job: Job<JobData>): Promise<JobResult> {
  const startTime = Date.now();
  const { userId, investigationId, toolName, inputData } = job.data;

  console.log(`Processing job ${job.id}: ${toolName} for user ${userId}`);

  try {
    // Update job status in database
    const supabase = createAdminClient();
    await (supabase
      .from('jobs') as any)
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    // Get the appropriate tool executor
    const executor = getToolExecutor(toolName);
    if (!executor) {
      throw new Error(`No executor found for tool: ${toolName}`);
    }

    // Report progress
    await job.updateProgress({
      percentage: 10,
      message: 'Initializing tool',
      stage: 'init',
    });

    // Execute the tool
    const result = await executor.execute(inputData, {
      onProgress: async (progress) => {
        await job.updateProgress({
          percentage: progress.percentage,
          message: progress.message,
          stage: progress.stage,
        });

        // Update progress in database
        await (supabase
          .from('jobs') as any)
          .update({
            progress: progress.percentage,
          })
          .eq('id', job.id);
      },
    });

    const executionTime = Date.now() - startTime;

    // Update job as completed in database
    await (supabase
      .from('jobs') as any)
      .update({
        status: 'completed',
        output_data: result,
        progress: 100,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    console.log(`Job ${job.id} completed in ${executionTime}ms`);

    return {
      success: true,
      data: result,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`Job ${job.id} failed:`, errorMessage);

    // Update job as failed in database
    const supabase = createAdminClient();
    await (supabase
      .from('jobs') as any)
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    return {
      success: false,
      error: errorMessage,
      executionTime,
    };
  }
}

/**
 * Start the worker
 */
export function startWorker(options: WorkerOptions = {}): Worker<JobData, JobResult> {
  if (worker) {
    return worker;
  }

  const connection = getRedisConnection();

  worker = new Worker<JobData, JobResult>(QUEUE_NAME, processJob, {
    connection,
    concurrency: options.concurrency || 5,
    limiter: options.limiter || {
      max: 10,
      duration: 1000, // 10 jobs per second
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 1000 },
  });

  // Worker event handlers
  worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  worker.on('active', (job) => {
    console.log(`Job ${job.id} is now active`);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`Job ${jobId} has stalled`);
  });

  console.log('Tool worker started');

  return worker;
}

/**
 * Stop the worker
 */
export async function stopWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    console.log('Tool worker stopped');
  }
}

/**
 * Get worker status
 */
export function isWorkerRunning(): boolean {
  return worker !== null && !worker.closing;
}

/**
 * Get worker instance
 */
export function getWorker(): Worker<JobData, JobResult> | null {
  return worker;
}
