import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Validation schemas
const createWebhookSchema = z.object({
  url: z.string().url().startsWith('http'),
  description: z.string().max(500).optional(),
  events: z.array(z.string()).min(1),
  secret: z.string().min(8).optional(),
  headers: z.record(z.string()).optional(),
});

/**
 * GET /api/webhooks
 * List webhooks for the authenticated user
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const is_active = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('webhooks')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data: webhooks, error, count } = await query;

    if (error) {
      console.error('Error fetching webhooks:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch webhooks' }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      total: count || 0,
      active: webhooks?.filter((w) => w.is_active).length || 0,
      inactive: webhooks?.filter((w) => !w.is_active).length || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        webhooks,
        stats,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: count ? offset + limit < count : false,
        },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/webhooks:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/webhooks
 * Create a new webhook
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createWebhookSchema.safeParse(body);

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

    const { url, description, events, secret, headers } = validationResult.data;

    // Generate a secret if not provided
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

    // Create webhook
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .insert({
        id: uuidv4(),
        user_id: user.id,
        url,
        description,
        events,
        secret: webhookSecret,
        headers: headers || {},
        is_active: true,
        total_deliveries: 0,
        successful_deliveries: 0,
        failed_deliveries: 0,
      })
      .select()
      .single();

    if (webhookError) {
      console.error('Error creating webhook:', webhookError);
      return NextResponse.json({ success: false, error: 'Failed to create webhook' }, { status: 500 });
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'webhook.created',
      resource_type: 'webhook',
      resource_id: webhook.id,
      metadata: {
        url,
        events,
      },
    });

    return NextResponse.json({
      success: true,
      data: webhook,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/webhooks:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
