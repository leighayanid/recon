/**
 * Webhook delivery utility
 * Handles sending webhooks to user-defined endpoints
 */

import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import type { WebhookPayload, WebhookEventType } from '@/types/webhooks';

export interface DeliverWebhookOptions {
  userId: string;
  eventType: WebhookEventType;
  data: Record<string, any>;
}

export interface WebhookDeliveryResult {
  success: boolean;
  deliveredCount: number;
  failedCount: number;
}

/**
 * Deliver webhooks to all active webhooks subscribed to the event
 */
export async function deliverWebhooks(options: DeliverWebhookOptions): Promise<WebhookDeliveryResult> {
  const { userId, eventType, data } = options;

  try {
    const supabase = await createClient();

    // Find all active webhooks for this user that subscribe to this event
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .contains('events', [eventType]);

    if (error) {
      console.error('Error fetching webhooks:', error);
      return { success: false, deliveredCount: 0, failedCount: 0 };
    }

    if (!webhooks || webhooks.length === 0) {
      return { success: true, deliveredCount: 0, failedCount: 0 };
    }

    // Deliver to each webhook
    let deliveredCount = 0;
    let failedCount = 0;

    for (const webhook of webhooks) {
      const result = await deliverWebhook({
        webhook,
        eventType,
        data,
        userId,
      });

      if (result.success) {
        deliveredCount++;
      } else {
        failedCount++;
      }
    }

    return {
      success: true,
      deliveredCount,
      failedCount,
    };
  } catch (error) {
    console.error('Error delivering webhooks:', error);
    return { success: false, deliveredCount: 0, failedCount: 0 };
  }
}

/**
 * Deliver a single webhook
 */
async function deliverWebhook(options: {
  webhook: any;
  eventType: WebhookEventType;
  data: Record<string, any>;
  userId: string;
}): Promise<{ success: boolean; deliveryId?: string }> {
  const { webhook, eventType, data, userId } = options;
  const supabase = await createClient();

  // Create payload
  const payload: WebhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data,
    user_id: userId,
    webhook_id: webhook.id,
  };

  // Generate signature
  const signature = generateSignature(JSON.stringify(payload), webhook.secret || '');

  // Create delivery record
  const { data: delivery, error: deliveryError } = await supabase
    .from('webhook_deliveries')
    .insert({
      webhook_id: webhook.id,
      event_type: eventType,
      payload,
      status: 'pending',
      attempts: 0,
      max_attempts: 5,
    })
    .select()
    .single();

  if (deliveryError || !delivery) {
    console.error('Error creating webhook delivery:', deliveryError);
    return { success: false };
  }

  // Attempt delivery
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OSINT-Webhook/1.0',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': eventType,
        'X-Webhook-Timestamp': payload.timestamp,
        ...webhook.headers,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const responseBody = await response.text();
    const success = response.ok;

    // Update delivery record
    await supabase
      .from('webhook_deliveries')
      .update({
        status: success ? 'success' : 'failed',
        http_status: response.status,
        response_body: responseBody.substring(0, 1000), // Limit size
        attempts: 1,
        delivered_at: success ? new Date().toISOString() : null,
      })
      .eq('id', delivery.id);

    return { success, deliveryId: delivery.id };
  } catch (error: any) {
    console.error('Error delivering webhook:', error);

    // Update delivery record with error
    await supabase
      .from('webhook_deliveries')
      .update({
        status: 'failed',
        error_message: error.message,
        attempts: 1,
        next_retry_at: calculateNextRetry(1),
      })
      .eq('id', delivery.id);

    // Schedule retry
    scheduleWebhookRetry(delivery.id, webhook.id, payload, 1);

    return { success: false, deliveryId: delivery.id };
  }
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Calculate next retry time with exponential backoff
 */
function calculateNextRetry(attempt: number): string {
  const delays = [5, 30, 60, 300, 900]; // 5s, 30s, 1m, 5m, 15m
  const delaySeconds = delays[Math.min(attempt - 1, delays.length - 1)];
  const nextRetry = new Date(Date.now() + delaySeconds * 1000);
  return nextRetry.toISOString();
}

/**
 * Schedule webhook retry (to be implemented with job queue)
 */
function scheduleWebhookRetry(
  deliveryId: string,
  webhookId: string,
  payload: WebhookPayload,
  attempt: number
): void {
  // TODO: Implement with job queue (Bull/BullMQ)
  // For now, just log the retry schedule
  console.log(`Webhook retry scheduled for delivery ${deliveryId}, attempt ${attempt + 1}`);
}

/**
 * Verify webhook signature (for incoming webhooks from external services)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Helper functions for common webhook events
 */
export const webhookHelpers = {
  /**
   * Send webhook for job events
   */
  async jobCreated(userId: string, jobData: any) {
    return deliverWebhooks({
      userId,
      eventType: 'job.created',
      data: jobData,
    });
  },

  async jobCompleted(userId: string, jobData: any) {
    return deliverWebhooks({
      userId,
      eventType: 'job.completed',
      data: jobData,
    });
  },

  async jobFailed(userId: string, jobData: any) {
    return deliverWebhooks({
      userId,
      eventType: 'job.failed',
      data: jobData,
    });
  },

  /**
   * Send webhook for investigation events
   */
  async investigationCreated(userId: string, investigationData: any) {
    return deliverWebhooks({
      userId,
      eventType: 'investigation.created',
      data: investigationData,
    });
  },

  async investigationUpdated(userId: string, investigationData: any) {
    return deliverWebhooks({
      userId,
      eventType: 'investigation.updated',
      data: investigationData,
    });
  },

  /**
   * Send webhook for report events
   */
  async reportGenerated(userId: string, reportData: any) {
    return deliverWebhooks({
      userId,
      eventType: 'report.generated',
      data: reportData,
    });
  },

  async reportShared(userId: string, reportData: any) {
    return deliverWebhooks({
      userId,
      eventType: 'report.shared',
      data: reportData,
    });
  },
};
