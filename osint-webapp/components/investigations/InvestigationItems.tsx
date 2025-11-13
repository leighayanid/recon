"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Globe,
  Mail,
  Phone,
  Image as ImageIcon,
  Star,
  Edit,
  Trash2,
  Save,
  X as XIcon,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import type { InvestigationItemWithJob } from "@/types/investigations"
import Link from "next/link"

interface InvestigationItemsProps {
  items: InvestigationItemWithJob[]
  investigationId: string
}

const toolIcons: Record<string, any> = {
  sherlock: Search,
  theharvester: Globe,
  holehe: Mail,
  phoneinfoga: Phone,
  exiftool: ImageIcon,
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  },
  running: {
    label: "Running",
    icon: Loader2,
    className: "bg-blue-500/10 text-blue-700 border-blue-200",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-green-500/10 text-green-700 border-green-200",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-red-500/10 text-red-700 border-red-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-gray-500/10 text-gray-700 border-gray-200",
  },
}

export function InvestigationItems({ items, investigationId }: InvestigationItemsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [deletingItem, setDeletingItem] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

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

  const handleEditClick = (item: InvestigationItemWithJob) => {
    setEditingItem(item.id)
    setNotes(item.notes || "")
    setTags(item.tags || [])
    setTagInput("")
  }

  const handleSaveNotes = async (itemId: string) => {
    setLoading(true)

    try {
      const response = await fetch(`/api/investigations/${investigationId}/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: notes.trim() || undefined,
          tags: tags.length > 0 ? tags : [],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to update item")
      }

      toast({
        title: "Success",
        description: "Item updated successfully",
      })

      setEditingItem(null)
      router.refresh()
    } catch (error) {
      console.error("Failed to update item:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    setLoading(true)

    try {
      const response = await fetch(`/api/investigations/${investigationId}/items/${itemId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to remove item")
      }

      toast({
        title: "Success",
        description: "Item removed from investigation",
      })

      setDeletingItem(null)
      router.refresh()
    } catch (error) {
      console.error("Failed to remove item:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            No items in this investigation yet. Add jobs to get started.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const job = item.job as any
        const ToolIcon = toolIcons[job.tool_name] || Search
        const status = statusConfig[job.status as keyof typeof statusConfig]
        const StatusIcon = status.icon
        const isEditing = editingItem === item.id

        return (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ToolIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base capitalize">{job.tool_name}</CardTitle>
                      <Badge variant="secondary" className={status.className}>
                        <StatusIcon className={`h-3 w-3 mr-1 ${job.status === "running" ? "animate-spin" : ""}`} />
                        {status.label}
                      </Badge>
                      {item.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <CardDescription className="text-sm">
                      Created {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard?job=${job.id}`}>
                    <Button variant="outline" size="sm">
                      View Results
                    </Button>
                  </Link>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Notes Section */}
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Notes</label>
                    <Textarea
                      placeholder="Add notes about this item..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tags</label>
                    <Input
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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveNotes(item.id)}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingItem(null)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {item.notes && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      {item.notes}
                    </div>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {!item.notes && (!item.tags || item.tags.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">
                      No notes or tags. Click edit to add some.
                    </p>
                  )}
                </div>
              )}

              {/* Job Input Data Preview */}
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-muted-foreground">
                  <strong>Input:</strong>{" "}
                  {job.input_data && typeof job.input_data === "object" ? (
                    Object.entries(job.input_data as Record<string, any>)
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <span key={key} className="ml-2">
                          {key}: <strong>{String(value)}</strong>
                        </span>
                      ))
                  ) : (
                    String(job.input_data)
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deletingItem !== null} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this item from the investigation?
              The job and its results will not be deleted, only removed from this investigation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingItem(null)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingItem && handleDelete(deletingItem)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
