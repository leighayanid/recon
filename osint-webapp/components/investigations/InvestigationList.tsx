"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, Archive, AlertCircle, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { InvestigationWithStats } from "@/types/investigations"

interface InvestigationListProps {
  investigations: InvestigationWithStats[]
}

const statusConfig = {
  active: {
    label: "Active",
    icon: Clock,
    variant: "default" as const,
    className: "bg-blue-500/10 text-blue-700 border-blue-200",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    variant: "secondary" as const,
    className: "bg-green-500/10 text-green-700 border-green-200",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    variant: "outline" as const,
    className: "bg-gray-500/10 text-gray-700 border-gray-200",
  },
}

export function InvestigationList({ investigations }: InvestigationListProps) {
  return (
    <div className="grid gap-4">
      {investigations.map((investigation) => {
        const status = statusConfig[investigation.status as keyof typeof statusConfig]
        const StatusIcon = status.icon

        return (
          <Link key={investigation.id} href={`/investigations/${investigation.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{investigation.name}</CardTitle>
                      <Badge variant={status.variant} className={status.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    {investigation.description && (
                      <CardDescription className="line-clamp-2">
                        {investigation.description}
                      </CardDescription>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{investigation.item_count}</span>
                      <span>items</span>
                    </div>
                    {investigation.completed_jobs > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        <span>{investigation.completed_jobs} completed</span>
                      </div>
                    )}
                    {investigation.pending_jobs > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-yellow-600" />
                        <span>{investigation.pending_jobs} pending</span>
                      </div>
                    )}
                    {investigation.failed_jobs > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                        <span>{investigation.failed_jobs} failed</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(investigation.updated_at), { addSuffix: true })}
                  </div>
                </div>

                {/* Tags */}
                {investigation.tags && investigation.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {investigation.tags.slice(0, 5).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {investigation.tags.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{investigation.tags.length - 5} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
