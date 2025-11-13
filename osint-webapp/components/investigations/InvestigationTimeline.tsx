"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Edit,
  Archive,
  FolderOpen,
  AlertTriangle,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import type { InvestigationDetail } from "@/types/investigations"

interface InvestigationTimelineProps {
  investigation: InvestigationDetail
}

interface TimelineEvent {
  id: string
  type: string
  title: string
  description?: string
  timestamp: string
  icon: any
  color: string
}

export function InvestigationTimeline({ investigation }: InvestigationTimelineProps) {
  // Build timeline events from investigation data
  const events: TimelineEvent[] = []

  // Investigation created
  events.push({
    id: `created-${investigation.id}`,
    type: "investigation_created",
    title: "Investigation Created",
    description: investigation.description || undefined,
    timestamp: investigation.created_at,
    icon: FolderOpen,
    color: "text-blue-500",
  })

  // Add events for each item
  investigation.items.forEach((item) => {
    const job = item.job as any

    // Item added
    events.push({
      id: `item-added-${item.id}`,
      type: "item_added",
      title: `${job.tool_name.charAt(0).toUpperCase() + job.tool_name.slice(1)} Job Added`,
      description: item.notes || `Job #${job.id.slice(0, 8)}`,
      timestamp: item.created_at,
      icon: Plus,
      color: "text-green-500",
    })

    // Job completed
    if (job.status === "completed" && job.completed_at) {
      events.push({
        id: `job-completed-${job.id}`,
        type: "job_completed",
        title: `${job.tool_name.charAt(0).toUpperCase() + job.tool_name.slice(1)} Completed`,
        description: `Job finished successfully`,
        timestamp: job.completed_at,
        icon: CheckCircle2,
        color: "text-green-600",
      })
    }

    // Job failed
    if (job.status === "failed" && job.completed_at) {
      events.push({
        id: `job-failed-${job.id}`,
        type: "job_failed",
        title: `${job.tool_name.charAt(0).toUpperCase() + job.tool_name.slice(1)} Failed`,
        description: job.error_message || "Job failed to complete",
        timestamp: job.completed_at,
        icon: XCircle,
        color: "text-red-600",
      })
    }
  })

  // Status changes (based on investigation status and timestamps)
  if (investigation.status === "completed") {
    events.push({
      id: `status-completed-${investigation.id}`,
      type: "status_changed",
      title: "Investigation Completed",
      description: "Investigation marked as completed",
      timestamp: investigation.updated_at,
      icon: CheckCircle2,
      color: "text-green-500",
    })
  } else if (investigation.status === "archived") {
    events.push({
      id: `status-archived-${investigation.id}`,
      type: "status_changed",
      title: "Investigation Archived",
      description: "Investigation moved to archive",
      timestamp: investigation.updated_at,
      icon: Archive,
      color: "text-gray-500",
    })
  }

  // Sort events by timestamp (newest first)
  const sortedEvents = events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity Timeline</CardTitle>
        <CardDescription>
          {sortedEvents.length} events in this investigation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

          {sortedEvents.map((event, index) => (
            <div key={event.id} className="relative flex gap-3">
              {/* Icon */}
              <div
                className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-border ${event.color}`}
              >
                <event.icon className="h-3.5 w-3.5" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}

          {sortedEvents.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No activity yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
