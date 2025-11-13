import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const updateWebhookSchema = z.object({
  url: z.string().url().startsWith('http').optional(),
  description: z.string().max(500).optional(),
  events: z.array(z.string()).min(1).optional(),
  secret: z.string().min(8).optional(),
  headers: z.record(z.string()).optional(),
  is_active: z.boolean().optional(),
});

/**
 * GET /api/webhooks/[id]
 * Get webhook details with delivery history
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get webhook
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .eq('user_id', user.id)
      .single();

    if (webhookError || !webhook) {
      return NextResponse.json({ success: false, error: 'Webhook not found' }, { status: 404 });
    }

    // Get recent deliveries
    const { data: deliveries, error: deliveriesError } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (deliveriesError) {
      console.error('Error fetching webhook deliveries:', deliveriesError);
    }

    // Calculate statistics
    const stats = {
      success_rate: webhook.total_deliveries > 0
        ? ((webhook.successful_deliveries / webhook.total_deliveries) * 100).toFixed(2)
        : 0,
      total_deliveries: webhook.total_deliveries,
      successful_deliveries: webhook.successful_deliveries,
      failed_deliveries: webhook.failed_deliveries,
      last_delivery_at: webhook.last_delivery_at,
    };

    return NextResponse.json({
      success: true,
      data: {
        webhook,
        deliveries: deliveries || [],
        stats,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/webhooks/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/webhooks/[id]
 * Update webhook details
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { data: existingWebhook, error: fetchError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingWebhook) {
      return NextResponse.json({ success: false, error: 'Webhook not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateWebhookSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Update webhook
    const { data: updatedWebhook, error: updateError } = await supabase
      .from('webhooks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', webhookId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating webhook:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to update webhook' }, { status: 500 });
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'webhook.updated',
      resource_type: 'webhook',
      resource_id: webhookId,
      metadata: updates,
    });

    return NextResponse.json({
      success: true,
      data: updatedWebhook,
    });
  } catch (error) {
    console.error('Error in PATCH /api/webhooks/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/webhooks/[id]
 * Delete a webhook
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { data: existingWebhook, error: fetchError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingWebhook) {
      return NextResponse.json({ success: false, error: 'Webhook not found' }, { status: 404 });
    }

    // Delete webhook (deliveries will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting webhook:', deleteError);
      return NextResponse.json({ success: false, error: 'Failed to delete webhook' }, { status: 500 });
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'webhook.deleted',
      resource_type: 'webhook',
      resource_id: webhookId,
      metadata: {
        url: existingWebhook.url,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/webhooks/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
