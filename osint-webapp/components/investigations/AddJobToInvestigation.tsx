"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2, Search, CheckCircle2, Clock, XCircle, X as XIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Job } from "@/types/investigations"

interface AddJobToInvestigationProps {
  investigationId: string
}

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-600" },
  running: { label: "Running", icon: Loader2, color: "text-blue-600" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-green-600" },
  failed: { label: "Failed", icon: XCircle, color: "text-red-600" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-gray-600" },
}

export function AddJobToInvestigation({ investigationId }: AddJobToInvestigationProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  // Fetch available jobs when dialog opens
  useEffect(() => {
    if (open) {
      fetchJobs()
    }
  }, [open])

  const fetchJobs = async () => {
    try {
      const response = await fetch(`/api/jobs?limit=100`)
      const data = await response.json()

      if (response.ok) {
        setJobs(data.data.jobs || [])
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedJobId) {
      toast({
        title: "Error",
        description: "Please select a job to add",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/investigations/${investigationId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: selectedJobId,
          notes: notes.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to add job to investigation")
      }

      toast({
        title: "Success",
        description: "Job added to investigation successfully",
      })

      // Reset form
      setSelectedJobId("")
      setNotes("")
      setTags([])
      setTagInput("")
      setOpen(false)

      // Refresh the page
      router.refresh()
    } catch (error) {
      console.error("Failed to add job:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add job to investigation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedJob = jobs.find((j) => j.id === selectedJobId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Job to Investigation</DialogTitle>
            <DialogDescription>
              Select an existing job to add to this investigation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="job">
                Select Job <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedJobId}
                onValueChange={setSelectedJobId}
                disabled={loading}
              >
                <SelectTrigger id="job">
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No jobs available
                    </div>
                  ) : (
                    jobs.map((job) => {
                      const status = statusConfig[job.status as keyof typeof statusConfig]
                      const StatusIcon = status.icon
                      return (
                        <SelectItem key={job.id} value={job.id}>
                          <div className="flex items-center gap-2">
                            <span className="capitalize">{job.tool_name}</span>
                            <Badge variant="outline" className="text-xs">
                              <StatusIcon className={`h-3 w-3 mr-1 ${status.color}`} />
                              {status.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
              {selectedJob && (
                <div className="mt-2 p-2 bg-muted rounded-md text-xs">
                  <div>
                    <strong>Tool:</strong> {selectedJob.tool_name}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedJob.status}
                  </div>
                  <div>
                    <strong>Created:</strong>{" "}
                    {new Date(selectedJob.created_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this job (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Type a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                disabled={loading}
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                        disabled={loading}
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedJobId}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Job"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
