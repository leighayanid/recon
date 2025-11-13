/**
 * Single Investigation Item API Routes
 * PATCH /api/investigations/[id]/items/[itemId] - Update item
 * DELETE /api/investigations/[id]/items/[itemId] - Remove item from investigation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  formatErrorResponse,
  logError,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const updateItemSchema = z.object({
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).optional(),
  is_favorite: z.boolean().optional(),
});

/**
 * PATCH /api/investigations/[id]/items/[itemId]
 * Update investigation item (notes, tags, favorite status)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    const { id: investigationId, itemId } = await params;

    // Verify ownership through investigation
    const { data: investigation, error: invError } = await supabase
      .from('investigations')
      .select('id')
      .eq('id', investigationId)
      .eq('user_id', user.id)
      .single();

    if (invError || !investigation) {
      throw new NotFoundError('Investigation not found');
    }

    // Verify item exists in this investigation
    const { data: existingItem, error: itemError } = await supabase
      .from('investigation_items')
      .select('id')
      .eq('id', itemId)
      .eq('investigation_id', investigationId)
      .single();

    if (itemError || !existingItem) {
      throw new NotFoundError('Investigation item not found');
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateItemSchema.safeParse(body);

    if (!validation.success) {
      throw new ValidationError(
        'Invalid item update',
        validation.error.errors
      );
    }

    const updates = validation.data;

    logger.info('Updating investigation item', {
      userId: user.id,
      investigationId,
      itemId,
      updates,
    });

    // Update item
    const { data: updated, error: updateError } = await supabase
      .from('investigation_items')
      .update(updates as any)
      .eq('id', itemId)
      .eq('investigation_id', investigationId)
      .select(`
        *,
        job:jobs(*)
      `)
      .single();

    if (updateError || !updated) {
      logger.error('Failed to update investigation item', updateError);
      throw new Error('Failed to update investigation item');
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'investigation_item_updated',
      resource_type: 'investigation_item',
      resource_id: itemId,
      metadata: { investigationId, updates },
    } as any);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logError(error as Error);
    const errorResponse = formatErrorResponse(
      error as Error,
      process.env.NODE_ENV === 'development'
    );

    const statusCode =
      error instanceof Error && 'statusCode' in error
        ? (error as any).statusCode
        : 500;

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * DELETE /api/investigations/[id]/items/[itemId]
 * Remove item from investigation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    const { id: investigationId, itemId } = await params;

    // Verify ownership through investigation
    const { data: investigation, error: invError } = await supabase
      .from('investigations')
      .select('id')
      .eq('id', investigationId)
      .eq('user_id', user.id)
      .single();

    if (invError || !investigation) {
      throw new NotFoundError('Investigation not found');
    }

    // Verify item exists
    const { data: existingItem, error: itemError } = await supabase
      .from('investigation_items')
      .select('job_id')
      .eq('id', itemId)
      .eq('investigation_id', investigationId)
      .single();

    if (itemError || !existingItem) {
      throw new NotFoundError('Investigation item not found');
    }

    logger.info('Removing item from investigation', {
      userId: user.id,
      investigationId,
      itemId,
    });

    // Delete item
    const { error: deleteError } = await supabase
      .from('investigation_items')
      .delete()
      .eq('id', itemId)
      .eq('investigation_id', investigationId);

    if (deleteError) {
      logger.error('Failed to delete investigation item', deleteError);
      throw new Error('Failed to remove item from investigation');
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'investigation_item_removed',
      resource_type: 'investigation_item',
      resource_id: itemId,
      metadata: { investigationId, jobId: existingItem.job_id },
    } as any);

    return NextResponse.json({
      success: true,
      message: 'Item removed from investigation',
    });
  } catch (error) {
    logError(error as Error);
    const errorResponse = formatErrorResponse(
      error as Error,
      process.env.NODE_ENV === 'development'
    );

    const statusCode =
      error instanceof Error && 'statusCode' in error
        ? (error as any).statusCode
        : 500;

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
