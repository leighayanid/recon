"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, ExternalLink, Clock } from "lucide-react"

interface PlatformCardProps {
  site: string
  url: string
  found: boolean
  responseTime?: number
  httpStatus?: number
}

export function PlatformCard({ site, url, found, responseTime, httpStatus }: PlatformCardProps) {
  return (
    <Card className={`transition-all hover:shadow-md ${found ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : "border-gray-300 dark:border-gray-700 opacity-60"}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              {found ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-400" />
              )}
              <h3 className="font-semibold text-lg">{site}</h3>
            </div>

            {found && (
              <>
                <p className="text-sm text-muted-foreground break-all">{url}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {responseTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{responseTime.toFixed(2)}s</span>
                    </div>
                  )}
                  {httpStatus && (
                    <span className={`font-mono ${httpStatus >= 200 && httpStatus < 300 ? "text-green-600" : "text-gray-600"}`}>
                      HTTP {httpStatus}
                    </span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => window.open(url, "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Visit Profile
                </Button>
              </>
            )}

            {!found && (
              <p className="text-xs text-muted-foreground">Not found on this platform</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
