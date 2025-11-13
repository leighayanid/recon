/**
 * Types for webhook system
 */

import { Database } from './database.types';

// Base webhook types from database
export type Webhook = Database['public']['Tables']['webhooks']['Row'];
export type WebhookInsert = Database['public']['Tables']['webhooks']['Insert'];
export type WebhookUpdate = Database['public']['Tables']['webhooks']['Update'];

// Webhook event types
export type WebhookEventType =
  | 'job.created'
  | 'job.started'
  | 'job.completed'
  | 'job.failed'
  | 'investigation.created'
  | 'investigation.updated'
  | 'investigation.deleted'
  | 'report.generated'
  | 'report.shared';

// Webhook status
export type WebhookStatus = 'active' | 'inactive' | 'failed';

// Webhook delivery status
export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed' | 'retrying';

// Webhook payload structure
export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, any>;
  user_id: string;
  webhook_id: string;
}

// Webhook delivery attempt
export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: WebhookEventType;
  payload: WebhookPayload;
  status: WebhookDeliveryStatus;
  http_status?: number;
  response_body?: string;
  error_message?: string;
  attempts: number;
  next_retry_at?: string;
  delivered_at?: string;
  created_at: string;
}

// Webhook configuration
export interface WebhookConfig {
  url: string;
  events: WebhookEventType[];
  secret?: string;
  headers?: Record<string, string>;
  enabled?: boolean;
  description?: string;
}

// Webhook with delivery stats
export interface WebhookWithStats extends Webhook {
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  last_delivery_at?: string;
  success_rate: number;
}

// Webhook test result
export interface WebhookTestResult {
  success: boolean;
  http_status?: number;
  response_time_ms: number;
  error_message?: string;
  response_body?: string;
}

// Webhook signature verification
export interface WebhookSignature {
  algorithm: 'sha256' | 'sha1';
  signature: string;
  timestamp: number;
}

// Webhook retry configuration
export interface WebhookRetryConfig {
  max_attempts: number;
  backoff_multiplier: number;
  initial_delay_seconds: number;
  max_delay_seconds: number;
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: WebhookRetryConfig = {
  max_attempts: 5,
  backoff_multiplier: 2,
  initial_delay_seconds: 5,
  max_delay_seconds: 3600, // 1 hour
};

// Webhook delivery log
export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: WebhookEventType;
  status: WebhookDeliveryStatus;
  http_status?: number;
  error_message?: string;
  attempts: number;
  created_at: string;
  delivered_at?: string;
}

// Webhook statistics
export interface WebhookStats {
  total_webhooks: number;
  active_webhooks: number;
  total_deliveries_24h: number;
  successful_deliveries_24h: number;
  failed_deliveries_24h: number;
  average_response_time_ms: number;
}

// Create webhook input
export interface CreateWebhookInput {
  url: string;
  events: WebhookEventType[];
  secret?: string;
  headers?: Record<string, string>;
  description?: string;
}

// Update webhook input
export interface UpdateWebhookInput {
  url?: string;
  events?: WebhookEventType[];
  secret?: string;
  headers?: Record<string, string>;
  description?: string;
  is_active?: boolean;
}

// Webhook delivery options
export interface WebhookDeliveryOptions {
  timeout_ms?: number;
  retry?: boolean;
  max_attempts?: number;
}

// Webhook event data types
export interface JobEventData {
  job_id: string;
  tool_name: string;
  status: string;
  input_data: any;
  output_data?: any;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface InvestigationEventData {
  investigation_id: string;
  name: string;
  description?: string;
  status: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface ReportEventData {
  report_id: string;
  name: string;
  investigation_id: string;
  template: string;
  format: string;
  is_public: boolean;
  created_at: string;
}

// Type guard functions
export function isJobEvent(event: WebhookEventType): boolean {
  return event.startsWith('job.');
}

export function isInvestigationEvent(event: WebhookEventType): boolean {
  return event.startsWith('investigation.');
}

export function isReportEvent(event: WebhookEventType): boolean {
  return event.startsWith('report.');
}
