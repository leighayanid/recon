'use client'

// User Management Component

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Search, RefreshCw, Edit, Ban, Trash2 } from 'lucide-react'
import type { AdminUserListItem } from '@/types/admin'
import { UserDetailsDialog } from './UserDetailsDialog'
import { EditUserDialog } from './EditUserDialog'
import { useToast } from '@/hooks/use-toast'

export function UserManagement() {
  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (search) params.append('search', search)

      const response = await fetch(`/api/admin/users?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setUsers(result.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchUsers()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'pro':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchUsers} size="icon" variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Users Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.full_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeColor(user.role)}>
                          {user.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.stats.total_jobs}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedUser(user.id)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingUser(user.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <UserDetailsDialog
          userId={selectedUser}
          open={!!selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {editingUser && (
        <EditUserDialog
          userId={editingUser}
          open={!!editingUser}
          onClose={() => {
            setEditingUser(null)
            fetchUsers()
          }}
        />
      )}
    </>
  )
}
