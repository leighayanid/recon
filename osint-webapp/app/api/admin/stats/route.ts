// Admin Dashboard Statistics API

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/adminAuth'

/**
 * GET /api/admin/stats
 * Get comprehensive system statistics
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

    // Call the database function to get system stats
    const { data: stats, error: statsError } = await supabase
      .rpc('get_system_stats')

    if (statsError) {
      console.error('Error fetching system stats:', statsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch system statistics' },
        { status: 500 }
      )
    }

    // Get webhook stats
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('id, is_active')

    const { data: webhookDeliveries, error: deliveriesError } = await supabase
      .from('webhook_deliveries')
      .select('id, status')

    // Get batch job stats
    const { data: batchJobs, error: batchError } = await supabase
      .from('batch_jobs')
      .select('id, status, total_operations')

    // Calculate webhook stats
    const webhookStats = {
      total: webhooks?.length || 0,
      active: webhooks?.filter(w => w.is_active).length || 0,
      inactive: webhooks?.filter(w => !w.is_active).length || 0,
      total_deliveries: webhookDeliveries?.length || 0,
      successful_deliveries: webhookDeliveries?.filter(d => d.status === 'delivered').length || 0,
      failed_deliveries: webhookDeliveries?.filter(d => d.status === 'failed').length || 0
    }

    // Calculate batch job stats
    const batchJobStats = {
      total: batchJobs?.length || 0,
      pending: batchJobs?.filter(b => b.status === 'pending').length || 0,
      running: batchJobs?.filter(b => b.status === 'running').length || 0,
      completed: batchJobs?.filter(b => b.status === 'completed').length || 0,
      failed: batchJobs?.filter(b => b.status === 'failed').length || 0,
      avg_operations_per_batch: batchJobs && batchJobs.length > 0
        ? batchJobs.reduce((sum, b) => sum + (b.total_operations || 0), 0) / batchJobs.length
        : 0
    }

    // Get tool usage by tool name
    const { data: toolJobs, error: toolError } = await supabase
      .from('jobs')
      .select('tool_name')

    const toolUsage: Record<string, number> = {}
    toolJobs?.forEach(job => {
      toolUsage[job.tool_name] = (toolUsage[job.tool_name] || 0) + 1
    })

    // Combine stats
    const combinedStats = {
      ...stats,
      webhooks: webhookStats,
      batch_jobs: batchJobStats,
      jobs: {
        ...stats.jobs,
        by_tool: toolUsage
      }
    }

    // Log admin action
    await logAdminAction('view_system_stats', null, null, {}, request)

    return NextResponse.json({
      success: true,
      data: combinedStats
    })
  } catch (error) {
    console.error('Error in admin stats:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
