// Admin Audit Logs API

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/adminAuth'

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filtering
 * Query params: user_id, action, resource_type, start_date, end_date, limit, offset
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
    const userId = searchParams.get('user_id')
    const action = searchParams.get('action')
    const resourceType = searchParams.get('resource_type')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate parameters
    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { success: false, error: 'Limit must be between 1-1000' },
        { status: 400 }
      )
    }

    // Build query - join with profiles to get user info
    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        user_id,
        action,
        resource_type,
        resource_id,
        ip_address,
        user_agent,
        metadata,
        created_at,
        profiles:user_id (
          email,
          full_name
        )
      `, { count: 'exact' })

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (action) {
      query = query.eq('action', action)
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Apply sorting and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Execute query
    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching audit logs:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch audit logs' },
        { status: 500 }
      )
    }

    // Transform data to include user info
    const transformedLogs = logs?.map(log => ({
      id: log.id,
      user_id: log.user_id,
      user_email: log.profiles?.email || null,
      user_name: log.profiles?.full_name || null,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      metadata: log.metadata,
      created_at: log.created_at
    }))

    // Log admin action
    await logAdminAction('view_audit_logs', null, null, {
      filters: { userId, action, resourceType, startDate, endDate }
    }, request)

    return NextResponse.json({
      success: true,
      data: transformedLogs || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error('Error in admin audit logs:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
