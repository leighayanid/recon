/**
 * Job Queue
 * BullMQ queue setup for OSINT tool execution
 */

import { Queue, QueueEvents } from 'bullmq';
import { getRedisConnection } from './connection';
import type { JobData, JobOptions, ToolName } from './types';

const QUEUE_NAME = 'osint-tools';

let queue: Queue<JobData> | null = null;
let queueEvents: QueueEvents | null = null;

/**
 * Get or create the BullMQ queue instance
 */
export function getQueue(): Queue<JobData> {
  if (!queue) {
    const connection = getRedisConnection();

    queue = new Queue<JobData>(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          count: 100,
          age: 24 * 3600, // 24 hours
        },
        removeOnFail: {
          count: 1000,
          age: 7 * 24 * 3600, // 7 days
        },
      },
    });

    queue.on('error', (err) => {
      console.error('Queue error:', err);
    });
  }

  return queue;
}

/**
 * Get or create the queue events instance for listening to job events
 */
export function getQueueEvents(): QueueEvents {
  if (!queueEvents) {
    const connection = getRedisConnection();
    queueEvents = new QueueEvents(QUEUE_NAME, { connection });
  }

  return queueEvents;
}

/**
 * Add a job to the queue
 */
export async function addJob(
  toolName: ToolName,
  inputData: Record<string, any>,
  userId: string,
  investigationId?: string,
  options?: JobOptions
) {
  const queue = getQueue();

  const jobData: JobData = {
    userId,
    investigationId,
    toolName,
    inputData,
    priority: options?.priority || 0,
  };

  const job = await queue.add(toolName, jobData, {
    priority: options?.priority,
    delay: options?.delay,
    attempts: options?.attempts,
    backoff: options?.backoff,
    removeOnComplete: options?.removeOnComplete,
    removeOnFail: options?.removeOnFail,
  });

  return {
    id: job.id as string,
    name: job.name,
    data: job.data,
  };
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string) {
  const queue = getQueue();
  return queue.getJob(jobId);
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string) {
  const job = await getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;
  const failedReason = job.failedReason;

  return {
    id: job.id,
    name: job.name,
    state,
    progress,
    failedReason,
    data: job.data,
    returnvalue: job.returnvalue,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  };
}

/**
 * Remove job from queue
 */
export async function removeJob(jobId: string) {
  const job = await getJob(jobId);
  if (job) {
    await job.remove();
    return true;
  }
  return false;
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId: string) {
  const job = await getJob(jobId);
  if (job) {
    await job.retry();
    return true;
  }
  return false;
}

/**
 * Get all jobs with specific state
 */
export async function getJobs(
  state: 'active' | 'waiting' | 'completed' | 'failed' | 'delayed',
  start = 0,
  end = 100
) {
  const queue = getQueue();
  return queue.getJobs(state, start, end);
}

/**
 * Get queue metrics
 */
export async function getQueueMetrics() {
  const queue = getQueue();

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Pause the queue
 */
export async function pauseQueue() {
  const queue = getQueue();
  await queue.pause();
}

/**
 * Resume the queue
 */
export async function resumeQueue() {
  const queue = getQueue();
  await queue.resume();
}

/**
 * Clean old jobs from the queue
 */
export async function cleanQueue(
  grace: number = 24 * 3600 * 1000, // 24 hours
  status: 'completed' | 'failed' = 'completed'
) {
  const queue = getQueue();
  await queue.clean(grace, 1000, status);
}

/**
 * Close the queue connection
 */
export async function closeQueue() {
  if (queue) {
    await queue.close();
    queue = null;
  }
  if (queueEvents) {
    await queueEvents.close();
    queueEvents = null;
  }
}
