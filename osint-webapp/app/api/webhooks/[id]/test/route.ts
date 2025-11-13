import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/webhooks/[id]/test
 * Test webhook delivery
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

    const webhookId = params.id;

    // Verify ownership
    const { data: webhook, error: fetchError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !webhook) {
      return NextResponse.json({ success: false, error: 'Webhook not found' }, { status: 404 });
    }

    // Create test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhook_id: webhookId,
      },
      user_id: user.id,
      webhook_id: webhookId,
    };

    // Send test webhook
    const startTime = Date.now();
    let success = false;
    let httpStatus: number | undefined;
    let errorMessage: string | undefined;
    let responseBody: string | undefined;

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OSINT-Webhook/1.0',
          'X-Webhook-Signature': generateSignature(JSON.stringify(testPayload), webhook.secret || ''),
          ...webhook.headers,
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      httpStatus = response.status;
      success = response.ok;
      responseBody = await response.text();
    } catch (error: any) {
      success = false;
      errorMessage = error.message;
    }

    const responseTime = Date.now() - startTime;

    // Log the test delivery
    await supabase.from('webhook_deliveries').insert({
      webhook_id: webhookId,
      event_type: 'webhook.test',
      payload: testPayload,
      status: success ? 'success' : 'failed',
      http_status: httpStatus,
      response_body: responseBody?.substring(0, 1000), // Limit response body size
      error_message: errorMessage,
      attempts: 1,
      max_attempts: 1,
      delivered_at: success ? new Date().toISOString() : null,
    });

    return NextResponse.json({
      success: true,
      data: {
        test_result: {
          success,
          http_status: httpStatus,
          response_time_ms: responseTime,
          error_message: errorMessage,
          response_body: responseBody?.substring(0, 200), // Return truncated response
        },
      },
    });
  } catch (error) {
    console.error('Error in POST /api/webhooks/[id]/test:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate HMAC signature
function generateSignature(payload: string, secret: string): string {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}
