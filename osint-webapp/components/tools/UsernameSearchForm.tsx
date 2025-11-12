"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Settings } from "lucide-react"

interface UsernameSearchFormProps {
  onSubmit: (username: string, options: SearchOptions) => void
  isLoading: boolean
}

interface SearchOptions {
  timeout?: number
  sites?: string[]
  proxy?: string
}

export function UsernameSearchForm({ onSubmit, isLoading }: UsernameSearchFormProps) {
  const [username, setUsername] = useState("")
  const [timeout, setTimeout] = useState("60")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [sites, setSites] = useState("")
  const [proxy, setProxy] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate username
    if (!username.trim()) {
      newErrors.username = "Username is required"
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      newErrors.username = "Username can only contain letters, numbers, underscores, and hyphens"
    } else if (username.length < 3 || username.length > 30) {
      newErrors.username = "Username must be between 3 and 30 characters"
    }

    // Validate timeout
    const timeoutNum = parseInt(timeout)
    if (isNaN(timeoutNum) || timeoutNum < 10 || timeoutNum > 300) {
      newErrors.timeout = "Timeout must be between 10 and 300 seconds"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const options: SearchOptions = {
      timeout: parseInt(timeout),
    }

    if (sites.trim()) {
      options.sites = sites.split(",").map((s) => s.trim()).filter(Boolean)
    }

    if (proxy.trim()) {
      options.proxy = proxy.trim()
    }

    onSubmit(username, options)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Parameters</CardTitle>
        <CardDescription>
          Enter a username to search across social media platforms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="e.g., johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className={errors.username ? "border-red-500" : ""}
            />
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username}</p>
            )}
          </div>

          {/* Timeout Input */}
          <div className="space-y-2">
            <Label htmlFor="timeout">Timeout (seconds)</Label>
            <Input
              id="timeout"
              type="number"
              min="10"
              max="300"
              value={timeout}
              onChange={(e) => setTimeout(e.target.value)}
              disabled={isLoading}
              className={errors.timeout ? "border-red-500" : ""}
            />
            {errors.timeout && (
              <p className="text-sm text-red-500">{errors.timeout}</p>
            )}
          </div>

          {/* Advanced Options Toggle */}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={isLoading}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              {showAdvanced ? "Hide" : "Show"} Advanced Options
            </Button>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="sites">Specific Sites (comma-separated)</Label>
                <Input
                  id="sites"
                  type="text"
                  placeholder="e.g., Twitter,Instagram,GitHub"
                  value={sites}
                  onChange={(e) => setSites(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to search all sites
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proxy">Proxy (optional)</Label>
                <Input
                  id="proxy"
                  type="text"
                  placeholder="e.g., http://proxy.example.com:8080"
                  value={proxy}
                  onChange={(e) => setProxy(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? "Searching..." : "Start Search"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
