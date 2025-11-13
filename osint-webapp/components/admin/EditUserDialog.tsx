'use client'

// Edit User Dialog Component

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

interface EditUserDialogProps {
  userId: string
  open: boolean
  onClose: () => void
}

export function EditUserDialog({ userId, open, onClose }: EditUserDialogProps) {
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('')
  const [isSuspended, setIsSuspended] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && userId) {
      fetchUser()
    }
  }, [userId, open])

  const fetchUser = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`)
      const result = await response.json()

      if (result.success && result.data.user) {
        const userData = result.data.user
        setUser(userData)
        setFullName(userData.full_name || '')
        setRole(userData.role)
        setIsSuspended(userData.is_suspended || false)
        setSuspensionReason(userData.suspension_reason || '')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      toast({
        title: 'Error',
        description: 'Failed to load user',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          role,
          is_suspended: isSuspended,
          suspension_reason: isSuspended ? suspensionReason : null
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update user')
      }

      toast({
        title: 'Success',
        description: 'User updated successfully'
      })
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Modify user details and permissions
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">Loading...</div>
        ) : !user ? (
          <div className="py-8 text-center text-destructive">Failed to load user</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="suspended"
                  checked={isSuspended}
                  onCheckedChange={(checked) => setIsSuspended(checked as boolean)}
                />
                <Label htmlFor="suspended">Suspend Account</Label>
              </div>
              {isSuspended && (
                <Input
                  placeholder="Suspension reason..."
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                />
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
