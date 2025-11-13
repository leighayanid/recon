// Admin User Management API - List Users

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/adminAuth'

/**
 * GET /api/admin/users
 * List all users with filtering and pagination
 * Query params: role, search, limit, offset, sort_by, sort_order
 * Admin only
 */
export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Limit must be between 1-100' },
        { status: 400 }
      )
    }

    // Build query
    let query = supabase
      .from('user_statistics')
      .select('*', { count: 'exact' })

    // Apply filters
    if (role) {
      query = query.eq('role', role)
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    // Apply sorting
    const validSortFields = ['created_at', 'email', 'last_sign_in_at', 'total_jobs', 'full_name']
    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy, {
        ascending: sortOrder === 'asc',
        nullsFirst: false
      })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: users, error, count } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction('list_users', 'users', null, { search, role, limit, offset }, request)

    return NextResponse.json({
      success: true,
      data: users || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error('Error in admin users list:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
