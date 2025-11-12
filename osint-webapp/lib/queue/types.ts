/**
 * Job Queue Types
 * Defines types for BullMQ job system
 */

import type { Database } from '@/types/database.types';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type ToolName =
  | 'sherlock'
  | 'maigret'
  | 'theharvester'
  | 'sublist3r'
  | 'amass'
  | 'holehe'
  | 'h8mail'
  | 'phoneinfoga'
  | 'exiftool';

export interface JobData {
  userId: string;
  investigationId?: string;
  toolName: ToolName;
  inputData: Record<string, any>;
  priority?: number;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
}

export interface JobProgress {
  percentage: number;
  message?: string;
  stage?: string;
}

// Database types
export type DbJob = Database['public']['Tables']['jobs']['Row'];
export type DbJobInsert = Database['public']['Tables']['jobs']['Insert'];
export type DbJobUpdate = Database['public']['Tables']['jobs']['Update'];

// Job options
export interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

// Worker options
export interface WorkerOptions {
  concurrency?: number;
  limiter?: {
    max: number;
    duration: number;
  };
}

// Job event types
export interface JobEvents {
  'job:created': { jobId: string; data: JobData };
  'job:progress': { jobId: string; progress: JobProgress };
  'job:completed': { jobId: string; result: JobResult };
  'job:failed': { jobId: string; error: string };
}
