// Admin Analytics API

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/adminAuth'

/**
 * GET /api/admin/analytics
 * Get usage analytics time series data
 * Query params: days (default: 30)
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
    const days = parseInt(searchParams.get('days') || '30')

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { success: false, error: 'Invalid days parameter (must be between 1-365)' },
        { status: 400 }
      )
    }

    // Call the database function to get analytics
    const { data: timeSeriesData, error: analyticsError } = await supabase
      .rpc('get_usage_analytics', { days })

    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics' },
        { status: 500 }
      )
    }

    // Parse the JSON result
    const timeSeries = timeSeriesData || []

    // Calculate totals
    const totals = timeSeries.reduce((acc: any, day: any) => {
      return {
        jobs: acc.jobs + day.jobs_created,
        investigations: acc.investigations + day.investigations_created,
        reports: acc.reports + day.reports_generated,
        users: acc.users + day.new_users
      }
    }, { jobs: 0, investigations: 0, reports: 0, users: 0 })

    // Calculate averages
    const averages = {
      jobs_per_day: timeSeries.length > 0 ? totals.jobs / timeSeries.length : 0,
      investigations_per_day: timeSeries.length > 0 ? totals.investigations / timeSeries.length : 0,
      reports_per_day: timeSeries.length > 0 ? totals.reports / timeSeries.length : 0,
      users_per_day: timeSeries.length > 0 ? totals.users / timeSeries.length : 0
    }

    // Calculate growth (comparing first half vs second half)
    const midPoint = Math.floor(timeSeries.length / 2)
    const firstHalf = timeSeries.slice(0, midPoint)
    const secondHalf = timeSeries.slice(midPoint)

    const firstHalfTotals = firstHalf.reduce((acc: any, day: any) => ({
      jobs: acc.jobs + day.jobs_created,
      investigations: acc.investigations + day.investigations_created,
      reports: acc.reports + day.reports_generated,
      users: acc.users + day.new_users
    }), { jobs: 0, investigations: 0, reports: 0, users: 0 })

    const secondHalfTotals = secondHalf.reduce((acc: any, day: any) => ({
      jobs: acc.jobs + day.jobs_created,
      investigations: acc.investigations + day.investigations_created,
      reports: acc.reports + day.reports_generated,
      users: acc.users + day.new_users
    }), { jobs: 0, investigations: 0, reports: 0, users: 0 })

    const growth = {
      jobs_percent: firstHalfTotals.jobs > 0
        ? ((secondHalfTotals.jobs - firstHalfTotals.jobs) / firstHalfTotals.jobs) * 100
        : 0,
      investigations_percent: firstHalfTotals.investigations > 0
        ? ((secondHalfTotals.investigations - firstHalfTotals.investigations) / firstHalfTotals.investigations) * 100
        : 0,
      reports_percent: firstHalfTotals.reports > 0
        ? ((secondHalfTotals.reports - firstHalfTotals.reports) / firstHalfTotals.reports) * 100
        : 0,
      users_percent: firstHalfTotals.users > 0
        ? ((secondHalfTotals.users - firstHalfTotals.users) / firstHalfTotals.users) * 100
        : 0
    }

    // Log admin action
    await logAdminAction('view_analytics', null, null, { days }, request)

    return NextResponse.json({
      success: true,
      data: {
        time_series: timeSeries,
        totals,
        averages,
        growth
      }
    })
  } catch (error) {
    console.error('Error in admin analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
