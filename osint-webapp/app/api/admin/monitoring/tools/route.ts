// Tool Usage Monitoring API

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/adminAuth'

/**
 * GET /api/admin/monitoring/tools
 * Get tool usage statistics
 * Query params: tool_name, start_date, end_date, min_executions, sort_by, sort_order, limit, offset
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
    const toolName = searchParams.get('tool_name')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const minExecutions = parseInt(searchParams.get('min_executions') || '0')
    const sortBy = searchParams.get('sort_by') || 'total_executions'
    const sortOrder = searchParams.get('sort_order') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Limit must be between 1-100' },
        { status: 400 }
      )
    }

    // Query tool_usage_statistics view
    let query = supabase
      .from('tool_usage_statistics')
      .select('*')

    // Apply filters
    if (toolName) {
      query = query.eq('tool_name', toolName)
    }

    if (minExecutions > 0) {
      query = query.gte('total_executions', minExecutions)
    }

    // Note: View doesn't support date filtering directly
    // For date filtering, we'd need to query jobs table directly

    // Apply sorting
    const validSortFields = ['total_executions', 'avg_execution_time_ms', 'total_users', 'executions_today']
    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy, {
        ascending: sortOrder === 'asc',
        nullsFirst: false
      })
    } else {
      query = query.order('total_executions', { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: toolStats, error } = await query

    if (error) {
      console.error('Error fetching tool statistics:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tool statistics' },
        { status: 500 }
      )
    }

    // Calculate success rates
    const enhancedStats = toolStats?.map(tool => ({
      ...tool,
      success_rate: tool.total_executions > 0
        ? (tool.successful / tool.total_executions) * 100
        : 0,
      failure_rate: tool.total_executions > 0
        ? (tool.failed / tool.total_executions) * 100
        : 0
    }))

    // Log admin action
    await logAdminAction('view_tool_stats', null, null, {
      filters: { toolName, startDate, endDate, minExecutions }
    }, request)

    return NextResponse.json({
      success: true,
      data: enhancedStats || [],
      pagination: {
        limit,
        offset,
        has_more: (toolStats?.length || 0) === limit
      }
    })
  } catch (error) {
    console.error('Error in tool statistics:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
