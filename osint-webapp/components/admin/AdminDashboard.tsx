'use client'

// Admin Dashboard Client Component

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  Activity,
  FileText,
  AlertCircle,
  TrendingUp,
  Server,
  Eye,
  BarChart3
} from 'lucide-react'
import { SystemStatsCards } from './SystemStatsCards'
import { UserManagement } from './UserManagement'
import { AuditLogsViewer } from './AuditLogsViewer'
import { SystemHealthMonitor } from './SystemHealthMonitor'
import { UsageAnalytics } from './UsageAnalytics'

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SystemStatsCards />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors"
                >
                  Manage Users
                </button>
                <button
                  onClick={() => setActiveTab('monitoring')}
                  className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors"
                >
                  View System Health
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors"
                >
                  View Analytics
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors"
                >
                  View Audit Logs
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View detailed activity in the Audit Logs tab
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="monitoring">
          <SystemHealthMonitor />
        </TabsContent>

        <TabsContent value="analytics">
          <UsageAnalytics />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogsViewer />
        </TabsContent>
      </Tabs>
    </div>
  )
}
