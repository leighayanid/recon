'use client'

// Audit Logs Viewer Component

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import type { AuditLogEntry } from '@/types/admin'

export function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 50

  useEffect(() => {
    fetchLogs()
  }, [offset])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      })

      const response = await fetch(`/api/admin/audit-logs?${params}`)
      const result = await response.json()

      if (result.success) {
        setLogs(result.data)
        setHasMore(result.pagination.has_more)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              View all system activity and administrative actions
            </CardDescription>
          </div>
          <Button onClick={fetchLogs} size="icon" variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.user_email || 'System'}
                        {log.user_name && (
                          <div className="text-xs text-muted-foreground">
                            {log.user_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.action}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.resource_type ? (
                        <div>
                          <div>{log.resource_type}</div>
                          {log.resource_id && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {log.resource_id.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {log.ip_address || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {offset + 1} - {offset + logs.length} entries
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={!hasMore}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
