"use client"

import { useState } from "react"
import { UsernameSearchForm } from "@/components/tools/UsernameSearchForm"
import { UsernameResults } from "@/components/tools/UsernameResults"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Info } from "lucide-react"

interface JobResult {
  id: string
  status: string
  progress: number
  output_data?: any
  error_message?: string
}

export default function UsernameSearchPage() {
  const [jobResult, setJobResult] = useState<JobResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearchSubmit = async (username: string, options: any) => {
    setIsSearching(true)
    setJobResult(null)

    try {
      // Create job
      const response = await fetch("/api/tools/username/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          ...options,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to start search")
      }

      const { data } = await response.json()
      const jobId = data.id

      // Poll for job status
      const pollInterval = setInterval(async () => {
        const statusResponse = await fetch(`/api/jobs/${jobId}`)
        if (!statusResponse.ok) {
          clearInterval(pollInterval)
          setIsSearching(false)
          return
        }

        const { data: jobData } = await statusResponse.json()
        setJobResult(jobData)

        if (jobData.status === "completed" || jobData.status === "failed") {
          clearInterval(pollInterval)
          setIsSearching(false)
        }
      }, 2000) // Poll every 2 seconds

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        setIsSearching(false)
      }, 300000)
    } catch (error) {
      console.error("Search error:", error)
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Search className="h-8 w-8 text-violet-500" />
          Username Search
        </h1>
        <p className="text-muted-foreground mt-2">
          Search for usernames across multiple social media platforms using Sherlock
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4" />
            About This Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Sherlock hunts down social media accounts by username across social networks.
            This tool checks over 300+ websites to find where a username is registered.
          </p>
          <p className="font-medium">
            Estimated time: 1-3 minutes depending on the number of sites checked.
          </p>
        </CardContent>
      </Card>

      {/* Search Form */}
      <UsernameSearchForm onSubmit={handleSearchSubmit} isLoading={isSearching} />

      {/* Results */}
      {jobResult && (
        <UsernameResults
          jobId={jobResult.id}
          status={jobResult.status}
          progress={jobResult.progress}
          results={jobResult.output_data}
          error={jobResult.error_message}
          isLoading={isSearching}
        />
      )}
    </div>
  )
}
