// System Health Monitoring API

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/middleware/adminAuth'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'down'
  response_time_ms: number
  message?: string
  details?: Record<string, any>
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)

    const responseTime = Date.now() - start

    if (error) {
      return {
        status: 'down',
        response_time_ms: responseTime,
        message: 'Database query failed',
        details: { error: error.message }
      }
    }

    return {
      status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'down',
      response_time_ms: responseTime,
      message: 'Database connection successful'
    }
  } catch (error) {
    return {
      status: 'down',
      response_time_ms: Date.now() - start,
      message: 'Database connection failed',
      details: { error: String(error) }
    }
  }
}

/**
 * Check storage health
 */
async function checkStorage(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    // List buckets to check storage
    const { data, error } = await supabase.storage.listBuckets()

    const responseTime = Date.now() - start

    if (error) {
      return {
        status: 'degraded',
        response_time_ms: responseTime,
        message: 'Storage check failed',
        details: { error: error.message }
      }
    }

    return {
      status: 'healthy',
      response_time_ms: responseTime,
      message: 'Storage accessible',
      details: { buckets_count: data?.length || 0 }
    }
  } catch (error) {
    return {
      status: 'down',
      response_time_ms: Date.now() - start,
      message: 'Storage connection failed',
      details: { error: String(error) }
    }
  }
}

/**
 * Check API health
 */
async function checkAPI(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    // Simple health check - if this endpoint is running, API is healthy
    const responseTime = Date.now() - start

    return {
      status: 'healthy',
      response_time_ms: responseTime,
      message: 'API is responding'
    }
  } catch (error) {
    return {
      status: 'down',
      response_time_ms: Date.now() - start,
      message: 'API check failed',
      details: { error: String(error) }
    }
  }
}

/**
 * Check queue health (placeholder - implement when queue is set up)
 */
async function checkQueue(): Promise<HealthCheck> {
  // TODO: Implement actual queue health check when job queue is implemented
  return {
    status: 'healthy',
    response_time_ms: 0,
    message: 'Queue health check not implemented',
    details: { note: 'Implement when job queue (Bull/Redis) is set up' }
  }
}

/**
 * Check Redis health (placeholder)
 */
async function checkRedis(): Promise<HealthCheck> {
  // TODO: Implement actual Redis health check when Redis is set up
  return {
    status: 'healthy',
    response_time_ms: 0,
    message: 'Redis health check not implemented',
    details: { note: 'Implement when Redis is set up' }
  }
}

/**
 * GET /api/admin/monitoring/health
 * Get system health status
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
    // Run all health checks in parallel
    const [database, storage, api, queue, redis] = await Promise.all([
      checkDatabase(),
      checkStorage(),
      checkAPI(),
      checkQueue(),
      checkRedis()
    ])

    const checks = { database, storage, api, queue, redis }

    // Determine overall status
    const statuses = Object.values(checks).map(check => check.status)
    let overallStatus: 'healthy' | 'degraded' | 'down' = 'healthy'

    if (statuses.includes('down')) {
      overallStatus = 'down'
    } else if (statuses.includes('degraded')) {
      overallStatus = 'degraded'
    }

    // Save metrics to database
    const supabase = await createClient()
    const metricsPromises = Object.entries(checks).map(([type, check]) =>
      supabase.from('system_metrics').insert({
        metric_type: type,
        status: check.status,
        response_time_ms: check.response_time_ms,
        message: check.message,
        metadata: check.details || {}
      })
    )

    await Promise.all(metricsPromises)

    return NextResponse.json({
      success: true,
      data: {
        status: overallStatus,
        checks,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error in health check:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        data: {
          status: 'down',
          checks: {},
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}
