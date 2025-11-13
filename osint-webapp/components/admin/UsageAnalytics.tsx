'use client'

// Usage Analytics Component

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { DataChart } from '@/components/visualizations/DataChart'
import type { UsageAnalytics as UsageAnalyticsType } from '@/types/admin'

export function UsageAnalytics() {
  const [analytics, setAnalytics] = useState<UsageAnalyticsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState('30')

  useEffect(() => {
    fetchAnalytics()
  }, [days])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?days=${days}`)
      const result = await response.json()

      if (result.success) {
        setAnalytics(result.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatGrowth = (percent: number) => {
    const Icon = percent >= 0 ? TrendingUp : TrendingDown
    const color = percent >= 0 ? 'text-green-600' : 'text-red-600'
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-4 w-4" />
        <span>{Math.abs(percent).toFixed(1)}%</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                Track system usage trends over time
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchAnalytics} size="icon" variant="outline" disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !analytics ? (
            <div className="py-8 text-center">Loading analytics...</div>
          ) : !analytics ? (
            <div className="py-8 text-center text-destructive">
              Failed to load analytics
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">
                      Total Jobs
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {analytics.totals.jobs.toLocaleString()}
                    </div>
                    <div className="text-xs mt-2">
                      {formatGrowth(analytics.growth.jobs_percent)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">
                      Investigations
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {analytics.totals.investigations.toLocaleString()}
                    </div>
                    <div className="text-xs mt-2">
                      {formatGrowth(analytics.growth.investigations_percent)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">
                      Reports
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {analytics.totals.reports.toLocaleString()}
                    </div>
                    <div className="text-xs mt-2">
                      {formatGrowth(analytics.growth.reports_percent)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground">
                      New Users
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {analytics.totals.users.toLocaleString()}
                    </div>
                    <div className="text-xs mt-2">
                      {formatGrowth(analytics.growth.users_percent)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Jobs Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Activity</CardTitle>
                  <CardDescription>Daily job creation and completion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataChart
                    type="line"
                    data={{
                      labels: analytics.time_series.map(d => d.date),
                      series: [
                        {
                          name: 'Created',
                          data: analytics.time_series.map(d => ({
                            label: d.date,
                            value: d.jobs_created
                          })),
                          color: '#3b82f6'
                        },
                        {
                          name: 'Completed',
                          data: analytics.time_series.map(d => ({
                            label: d.date,
                            value: d.jobs_completed
                          })),
                          color: '#10b981'
                        },
                        {
                          name: 'Failed',
                          data: analytics.time_series.map(d => ({
                            label: d.date,
                            value: d.jobs_failed
                          })),
                          color: '#ef4444'
                        }
                      ]
                    }}
                    options={{
                      title: 'Job Activity Over Time',
                      showLegend: true,
                      showGrid: true
                    }}
                  />
                </CardContent>
              </Card>

              {/* User Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                  <CardDescription>New users and active users over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataChart
                    type="area"
                    data={{
                      labels: analytics.time_series.map(d => d.date),
                      series: [
                        {
                          name: 'Active Users',
                          data: analytics.time_series.map(d => ({
                            label: d.date,
                            value: d.active_users
                          })),
                          color: '#8b5cf6'
                        },
                        {
                          name: 'New Users',
                          data: analytics.time_series.map(d => ({
                            label: d.date,
                            value: d.new_users
                          })),
                          color: '#06b6d4'
                        }
                      ]
                    }}
                    options={{
                      title: 'User Activity Over Time',
                      showLegend: true,
                      showGrid: true
                    }}
                  />
                </CardContent>
              </Card>

              {/* Averages */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Averages</CardTitle>
                  <CardDescription>Average activity per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Jobs/Day</div>
                      <div className="text-xl font-bold">
                        {analytics.averages.jobs_per_day.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Investigations/Day</div>
                      <div className="text-xl font-bold">
                        {analytics.averages.investigations_per_day.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Reports/Day</div>
                      <div className="text-xl font-bold">
                        {analytics.averages.reports_per_day.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Users/Day</div>
                      <div className="text-xl font-bold">
                        {analytics.averages.users_per_day.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
