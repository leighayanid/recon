// Admin User Management API - Individual User

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/adminAuth'
import { z } from 'zod'

const updateUserSchema = z.object({
  full_name: z.string().optional(),
  role: z.enum(['user', 'admin', 'pro']).optional(),
  is_suspended: z.boolean().optional(),
  suspension_reason: z.string().optional()
})

/**
 * GET /api/admin/users/[id]
 * Get detailed user information
 * Admin only
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check admin authorization
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    )
  }

  try {
    const supabase = await createClient()
    const userId = params.id

    // Validate UUID
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Get user details using the database function
    const { data, error } = await supabase
      .rpc('get_admin_user_details', { target_user_id: userId })

    if (error) {
      console.error('Error fetching user details:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user details' },
        { status: 500 }
      )
    }

    if (!data || !data.user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Log admin action
    await logAdminAction('view_user_details', 'user', userId, {}, request)

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error in admin user details:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user information
 * Admin only
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check admin authorization
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    )
  }

  try {
    const supabase = await createClient()
    const userId = params.id

    // Validate UUID
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = updateUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const updates = validation.data

    // Prevent admin from suspending themselves
    if (updates.is_suspended === true && userId === auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot suspend your own account' },
        { status: 400 }
      )
    }

    // Prevent admin from demoting themselves
    if (updates.role && updates.role !== 'admin' && userId === auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      )
    }

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Log admin action
    await logAdminAction(
      'update_user',
      'user',
      userId,
      { updates },
      request
    )

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Error in admin user update:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user and all associated data
 * Admin only
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check admin authorization
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    )
  }

  try {
    const supabase = await createClient()
    const userId = params.id

    // Validate UUID
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Prevent admin from deleting themselves
    if (userId === auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction(
      'delete_user',
      'user',
      userId,
      { email: user.email },
      request
    )

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error in admin user delete:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
