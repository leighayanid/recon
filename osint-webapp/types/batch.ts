/**
 * Types for batch processing operations
 */

import { ToolName } from '../lib/queue/types';

// Batch job types
export type BatchJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Batch operation for a single tool execution
export interface BatchOperation {
  id: string;
  tool_name: ToolName;
  input_data: Record<string, any>;
  priority?: number;
  metadata?: Record<string, any>;
}

// Batch job containing multiple operations
export interface BatchJob {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  investigation_id?: string;
  operations: BatchOperation[];
  status: BatchJobStatus;
  total_operations: number;
  completed_operations: number;
  failed_operations: number;
  progress_percentage: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Batch operation result
export interface BatchOperationResult {
  operation_id: string;
  job_id: string;
  status: 'success' | 'failed';
  output_data?: any;
  error_message?: string;
  execution_time_ms: number;
  completed_at: string;
}

// Batch job with results
export interface BatchJobWithResults extends BatchJob {
  results: BatchOperationResult[];
}

// Create batch job input
export interface CreateBatchJobInput {
  name: string;
  description?: string;
  investigation_id?: string;
  operations: Omit<BatchOperation, 'id'>[];
  execute_parallel?: boolean;
  max_parallel?: number;
  stop_on_error?: boolean;
}

// Batch job options
export interface BatchJobOptions {
  execute_parallel?: boolean;
  max_parallel?: number;
  stop_on_error?: boolean;
  timeout_per_operation_ms?: number;
  retry_failed?: boolean;
  max_retries?: number;
}

// Default batch job options
export const DEFAULT_BATCH_OPTIONS: BatchJobOptions = {
  execute_parallel: true,
  max_parallel: 5,
  stop_on_error: false,
  timeout_per_operation_ms: 300000, // 5 minutes
  retry_failed: true,
  max_retries: 3,
};

// Batch job progress
export interface BatchJobProgress {
  batch_job_id: string;
  total_operations: number;
  completed_operations: number;
  failed_operations: number;
  running_operations: number;
  pending_operations: number;
  progress_percentage: number;
  estimated_completion_time?: string;
  current_operation?: string;
}

// Batch job statistics
export interface BatchJobStats {
  total_execution_time_ms: number;
  average_operation_time_ms: number;
  fastest_operation_ms: number;
  slowest_operation_ms: number;
  success_rate: number;
}

// Batch template for common operation sets
export interface BatchTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  operations: Omit<BatchOperation, 'id'>[];
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Create batch template input
export interface CreateBatchTemplateInput {
  name: string;
  description?: string;
  operations: Omit<BatchOperation, 'id'>[];
  is_public?: boolean;
}

// Batch operation validation result
export interface BatchOperationValidation {
  operation_id: string;
  is_valid: boolean;
  errors?: string[];
}

// Batch job validation result
export interface BatchJobValidation {
  is_valid: boolean;
  total_operations: number;
  valid_operations: number;
  invalid_operations: number;
  validations: BatchOperationValidation[];
}

// Batch execution strategy
export type BatchExecutionStrategy = 'parallel' | 'sequential' | 'adaptive';

// Batch job queue info
export interface BatchQueueInfo {
  position: number;
  estimated_wait_time_ms: number;
  queue_length: number;
}

// Batch job cancellation
export interface BatchJobCancellation {
  batch_job_id: string;
  cancel_running: boolean;
  reason?: string;
}

// Batch job retry
export interface BatchJobRetry {
  batch_job_id: string;
  retry_failed_only: boolean;
  operations_to_retry?: string[];
}

// Batch export options
export interface BatchExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  include_metadata: boolean;
  include_errors: boolean;
  compress?: boolean;
}

// Bulk username search (example batch operation)
export interface BulkUsernameSearch {
  usernames: string[];
  platforms?: string[];
  timeout_per_username?: number;
}

// Bulk domain search (example batch operation)
export interface BulkDomainSearch {
  domains: string[];
  search_type: 'subdomains' | 'emails' | 'both';
  timeout_per_domain?: number;
}

// Bulk email search (example batch operation)
export interface BulkEmailSearch {
  emails: string[];
  check_breaches: boolean;
  timeout_per_email?: number;
}

// Helper function types for batch operations
export type BatchOperationGenerator = (input: any) => BatchOperation[];
export type BatchResultProcessor = (results: BatchOperationResult[]) => any;
export type BatchProgressCallback = (progress: BatchJobProgress) => void;

// Batch job event for webhooks
export interface BatchJobEvent {
  event: 'batch.created' | 'batch.started' | 'batch.progress' | 'batch.completed' | 'batch.failed';
  batch_job_id: string;
  progress?: BatchJobProgress;
  timestamp: string;
}
