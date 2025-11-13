'use client'

// User Details Dialog Component

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface UserDetailsDialogProps {
  userId: string
  open: boolean
  onClose: () => void
}

export function UserDetailsDialog({ userId, open, onClose }: UserDetailsDialogProps) {
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && userId) {
      fetchUserDetails()
    }
  }, [userId, open])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`)
      const result = await response.json()

      if (result.success) {
        setDetails(result.data)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Detailed information and activity for this user
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">Loading...</div>
        ) : !details ? (
          <div className="py-8 text-center text-destructive">Failed to load user details</div>
        ) : (
          <div className="space-y-4">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium">Email:</div>
                  <div className="text-sm">{details.user.email}</div>

                  <div className="text-sm font-medium">Name:</div>
                  <div className="text-sm">{details.user.full_name || '-'}</div>

                  <div className="text-sm font-medium">Role:</div>
                  <div>
                    <Badge>{details.user.role.toUpperCase()}</Badge>
                  </div>

                  <div className="text-sm font-medium">Created:</div>
                  <div className="text-sm">
                    {new Date(details.user.created_at).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{details.stats.total_jobs}</div>
                    <div className="text-xs text-muted-foreground">Total Jobs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{details.stats.total_investigations}</div>
                    <div className="text-xs text-muted-foreground">Investigations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{details.stats.total_reports}</div>
                    <div className="text-xs text-muted-foreground">Reports</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Last 20 actions</CardDescription>
              </CardHeader>
              <CardContent>
                {details.recent_activity && details.recent_activity.length > 0 ? (
                  <div className="space-y-2">
                    {details.recent_activity.slice(0, 10).map((activity: any) => (
                      <div key={activity.id} className="text-sm border-b pb-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{activity.action}</span>
                          <span className="text-muted-foreground">
                            {new Date(activity.created_at).toLocaleString()}
                          </span>
                        </div>
                        {activity.resource_type && (
                          <div className="text-xs text-muted-foreground">
                            {activity.resource_type}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No recent activity</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
