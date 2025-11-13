'use client'

// System Health Monitor Component

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import type { SystemHealth } from '@/types/admin'

export function SystemHealthMonitor() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchHealth = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/monitoring/health')
      const result = await response.json()

      if (result.success) {
        setHealth(result.data)
        setLastChecked(new Date())
      }
    } catch (error) {
      console.error('Error fetching health:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variant = status === 'healthy' ? 'default' : status === 'degraded' ? 'secondary' : 'destructive'
    return (
      <Badge variant={variant}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Health</CardTitle>
              <CardDescription>
                Real-time system component health monitoring
                {lastChecked && (
                  <span className="ml-2 text-xs">
                    Last checked: {lastChecked.toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button onClick={fetchHealth} size="icon" variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !health ? (
            <div className="py-8 text-center">Checking system health...</div>
          ) : !health ? (
            <div className="py-8 text-center text-destructive">
              Failed to check system health
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overall Status */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {getStatusIcon(health.status)}
                  <div>
                    <div className="font-semibold">Overall System Status</div>
                    <div className="text-sm text-muted-foreground">
                      All components checked
                    </div>
                  </div>
                </div>
                {getStatusBadge(health.status)}
              </div>

              {/* Individual Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(health.checks).map(([name, check]) => (
                  <Card key={name}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(check.status)}
                          <div>
                            <div className="font-medium capitalize">{name}</div>
                            <div className="text-sm text-muted-foreground">
                              {check.message}
                            </div>
                            {check.response_time_ms > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Response: {check.response_time_ms.toFixed(0)}ms
                              </div>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(check.status)}
                      </div>
                      {check.details && Object.keys(check.details).length > 0 && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          {Object.entries(check.details).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tool Usage Stats */}
      <ToolUsageStats />
    </div>
  )
}

function ToolUsageStats() {
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchToolStats()
  }, [])

  const fetchToolStats = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/tools?limit=10')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching tool stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Tools by Usage</CardTitle>
        <CardDescription>Most frequently used OSINT tools</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-4 text-center">Loading...</div>
        ) : stats.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">No data available</div>
        ) : (
          <div className="space-y-2">
            {stats.map((tool, index) => (
              <div
                key={tool.tool_name}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="font-mono text-lg font-bold text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{tool.tool_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {tool.total_users} users • Avg: {Math.round(tool.avg_execution_time_ms || 0)}ms
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{tool.total_executions}</div>
                  <div className="text-xs text-muted-foreground">
                    {tool.success_rate?.toFixed(1)}% success
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
