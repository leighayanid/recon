"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MoreVertical, Edit, Archive, CheckCircle2, Trash2, Clock, ArrowLeft, Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Investigation } from "@/types/investigations"
import Link from "next/link"

interface InvestigationHeaderProps {
  investigation: Investigation
}

const statusConfig = {
  active: {
    label: "Active",
    icon: Clock,
    className: "bg-blue-500/10 text-blue-700 border-blue-200",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-green-500/10 text-green-700 border-green-200",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    className: "bg-gray-500/10 text-gray-700 border-gray-200",
  },
}

export function InvestigationHeader({ investigation }: InvestigationHeaderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(investigation.name)
  const [description, setDescription] = useState(investigation.description || "")
  const [tags, setTags] = useState<string[]>(investigation.tags || [])
  const [tagInput, setTagInput] = useState("")

  const status = statusConfig[investigation.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

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

  const handleEdit = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Investigation name is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/investigations/${investigation.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          tags: tags.length > 0 ? tags : [],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to update investigation")
      }

      toast({
        title: "Success",
        description: "Investigation updated successfully",
      })

      setEditOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to update investigation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update investigation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)

    try {
      const response = await fetch(`/api/investigations/${investigation.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to update status")
      }

      toast({
        title: "Success",
        description: `Investigation marked as ${newStatus}`,
      })

      router.refresh()
    } catch (error) {
      console.error("Failed to update status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/investigations/${investigation.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to delete investigation")
      }

      toast({
        title: "Success",
        description: "Investigation deleted successfully",
      })

      router.push("/investigations")
      router.refresh()
    } catch (error) {
      console.error("Failed to delete investigation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete investigation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/investigations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{investigation.name}</h1>
            <Badge variant="secondary" className={status.className}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          {investigation.description && (
            <p className="text-muted-foreground mt-2 max-w-3xl">{investigation.description}</p>
          )}
          {investigation.tags && investigation.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {investigation.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleStatusChange("active")}>
              <Clock className="h-4 w-4 mr-2" />
              Mark as Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("archived")}>
              <Archive className="h-4 w-4 mr-2" />
              Mark as Archived
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Investigation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Investigation</DialogTitle>
            <DialogDescription>
              Update the investigation details, description, and tags.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tags">Tags</Label>
              <Input
                id="edit-tags"
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
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Investigation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this investigation? This action cannot be undone.
              All items and associations will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Investigation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
