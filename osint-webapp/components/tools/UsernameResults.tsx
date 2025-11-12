"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlatformCard } from "./PlatformCard"
import {
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Filter,
  Search,
  AlertCircle
} from "lucide-react"
import { Input } from "@/components/ui/input"

interface UsernameResultsProps {
  jobId: string
  status: string
  progress: number
  results?: any
  error?: string
  isLoading: boolean
}

export function UsernameResults({
  jobId,
  status,
  progress,
  results,
  error,
  isLoading
}: UsernameResultsProps) {
  const [filterText, setFilterText] = useState("")
  const [showOnlyFound, setShowOnlyFound] = useState(false)

  // Parse results
  const parsedResults = results?.parsed || results
  const platforms = parsedResults?.results || []
  const username = parsedResults?.username || ""
  const foundSites = parsedResults?.foundSites || 0
  const totalSites = parsedResults?.totalSites || 0
  const executionTime = parsedResults?.executionTime || 0

  // Filter platforms
  const filteredPlatforms = platforms.filter((platform: any) => {
    const matchesFilter = !filterText || platform.site.toLowerCase().includes(filterText.toLowerCase())
    const matchesFoundFilter = !showOnlyFound || platform.found
    return matchesFilter && matchesFoundFilter
  })

  // Export functions
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(parsedResults, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `sherlock_${username}_${Date.now()}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleExportCSV = () => {
    const headers = ['Site', 'Found', 'URL', 'Response Time', 'HTTP Status']
    const csvRows = [
      headers.join(','),
      ...platforms.map((p: any) => [
        p.site,
        p.found ? 'Yes' : 'No',
        p.url || '',
        p.responseTime || '',
        p.httpStatus || ''
      ].join(','))
    ]

    const csvString = csvRows.join('\n')
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvString)
    const exportFileDefaultName = `sherlock_${username}_${Date.now()}.csv`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleExportTXT = () => {
    const foundPlatforms = platforms.filter((p: any) => p.found)
    const txtContent = [
      `Sherlock Username Search Results`,
      `Username: ${username}`,
      `Found: ${foundSites}/${totalSites} platforms`,
      `Execution Time: ${executionTime}s`,
      `Date: ${new Date().toISOString()}`,
      ``,
      `Found Profiles:`,
      ``,
      ...foundPlatforms.map((p: any) => `${p.site}: ${p.url}`)
    ].join('\n')

    const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(txtContent)
    const exportFileDefaultName = `sherlock_${username}_${Date.now()}.txt`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Search Status</span>
            {status === "pending" && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
            {status === "running" && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
            {status === "completed" && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === "failed" && <XCircle className="h-5 w-5 text-red-500" />}
          </CardTitle>
          <CardDescription>
            Job ID: {jobId}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {(status === "pending" || status === "running") && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Summary Stats */}
          {status === "completed" && parsedResults && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{username}</div>
                <div className="text-xs text-muted-foreground mt-1">Username</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{foundSites}</div>
                <div className="text-xs text-muted-foreground mt-1">Found</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{totalSites}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Checked</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{executionTime.toFixed(1)}s</div>
                <div className="text-xs text-muted-foreground mt-1">Execution Time</div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-100">Search Failed</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Card */}
      {status === "completed" && platforms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {foundSites} profiles across {totalSites} platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Filter platforms..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={showOnlyFound ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOnlyFound(!showOnlyFound)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Found Only
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJSON}
                >
                  <Download className="h-4 w-4 mr-2" />
                  JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportTXT}
                >
                  <Download className="h-4 w-4 mr-2" />
                  TXT
                </Button>
              </div>
            </div>

            {/* Platform Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPlatforms.map((platform: any, index: number) => (
                <PlatformCard
                  key={`${platform.site}-${index}`}
                  site={platform.site}
                  url={platform.url}
                  found={platform.found}
                  responseTime={platform.responseTime}
                  httpStatus={platform.httpStatus}
                />
              ))}
            </div>

            {filteredPlatforms.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No platforms match your filter criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
