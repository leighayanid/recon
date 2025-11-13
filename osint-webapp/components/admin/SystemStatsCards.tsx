'use client'

// System Statistics Cards Component

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  Briefcase,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Webhook
} from 'lucide-react'
import type { SystemStats } from '@/types/admin'

export function SystemStatsCards() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stats')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats')
      }

      setStats(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Users */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.users.total.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            +{stats.users.new_today} today
          </p>
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.users.active_today.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Active today
          </p>
        </CardContent>
      </Card>

      {/* Total Jobs */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.jobs.total.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.jobs.today} today
          </p>
        </CardContent>
      </Card>

      {/* Completed Jobs */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.jobs.completed.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.jobs.total > 0 ? ((stats.jobs.completed / stats.jobs.total) * 100).toFixed(1) : 0}% success rate
          </p>
        </CardContent>
      </Card>

      {/* Failed Jobs */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Failed</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.jobs.failed.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.jobs.total > 0 ? ((stats.jobs.failed / stats.jobs.total) * 100).toFixed(1) : 0}% failure rate
          </p>
        </CardContent>
      </Card>

      {/* Pending Jobs */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.jobs.pending.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.jobs.running} running
          </p>
        </CardContent>
      </Card>

      {/* Investigations */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Investigations</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.investigations.total.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.investigations.active} active
          </p>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
          <Webhook className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.webhooks.total.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.webhooks.active} active
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
