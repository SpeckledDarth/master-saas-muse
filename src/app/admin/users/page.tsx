'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Loader2, Search, Users, Eye, Trash2, UserPlus, Download, Mail, Calendar, Clock, Shield, CheckCircle, XCircle, Crown, UserCog, User, Eye as ViewerIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UserWithRole {
  id: string
  email: string
  created_at: string
  role: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  phone: string | null
  name: string | null
  avatar_url: string | null
  provider: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      
      if (response.ok && data.users) {
        setUsers(data.users)
      } else {
        toast({
          title: 'Failed to load users',
          description: data.error || 'Unknown error',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Failed to load users',
        description: 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingRole(userId)
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({ title: 'Role updated', description: `User role changed to ${newRole}` })
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      } else {
        toast({ title: 'Failed to update role', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Failed to update role', description: 'Please try again', variant: 'destructive' })
    } finally {
      setUpdatingRole(null)
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) return
    setDeleting(true)
    
    try {
      const response = await fetch(`/api/admin/users?userId=${userToDelete.id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({ title: 'User deleted', description: 'User has been removed from the system' })
        setUsers(users.filter(u => u.id !== userToDelete.id))
        setUserToDelete(null)
      } else {
        toast({ title: 'Failed to delete user', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Failed to delete user', description: 'Please try again', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  async function handleInviteUser() {
    if (!inviteEmail.trim()) {
      toast({ title: 'Email required', variant: 'destructive' })
      return
    }
    
    setInviting(true)
    
    try {
      const response = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invite', email: inviteEmail, role: inviteRole })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({ title: 'Invitation sent', description: `Invitation sent to ${inviteEmail}` })
        setShowInviteDialog(false)
        setInviteEmail('')
        setInviteRole('member')
      } else {
        toast({ title: 'Failed to send invitation', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Failed to send invitation', description: 'Please try again', variant: 'destructive' })
    } finally {
      setInviting(false)
    }
  }

  function exportToCSV() {
    const headers = ['Email', 'Name', 'Role', 'Provider', 'Joined', 'Last Login', 'Email Verified']
    const rows = users.map(user => [
      user.email,
      user.name || '',
      user.role || 'No role',
      user.provider,
      new Date(user.created_at).toLocaleDateString(),
      user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never',
      user.email_confirmed_at ? 'Yes' : 'No'
    ])
    
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    toast({ title: 'Export complete', description: `Exported ${users.length} users` })
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3" />
      case 'manager': return <UserCog className="h-3 w-3" />
      case 'member': return <User className="h-3 w-3" />
      case 'viewer': return <ViewerIcon className="h-3 w-3" />
      default: return null
    }
  }

  function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' {
    switch (role) {
      case 'owner': return 'default'
      case 'manager': return 'secondary'
      default: return 'outline'
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  function formatTimeAgo(dateString: string | null) {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return formatDate(dateString)
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    user.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                View and manage all users in your application ({users.length} total)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToCSV}
                data-testid="button-export-users"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                size="sm" 
                onClick={() => setShowInviteDialog(true)}
                data-testid="button-invite-user"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, name, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-users"
            />
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Active</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.email} />
                          <AvatarFallback>{user.email.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name || user.email.split('@')[0]}</span>
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role || 'member'}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                        disabled={updatingRole === user.id}
                      >
                        <SelectTrigger className="w-[130px]" data-testid={`select-role-${user.id}`}>
                          {updatingRole === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue placeholder="Set role" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">
                            <div className="flex items-center gap-2">
                              <Crown className="h-3 w-3" /> Owner
                            </div>
                          </SelectItem>
                          <SelectItem value="manager">
                            <div className="flex items-center gap-2">
                              <UserCog className="h-3 w-3" /> Manager
                            </div>
                          </SelectItem>
                          <SelectItem value="member">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" /> Member
                            </div>
                          </SelectItem>
                          <SelectItem value="viewer">
                            <div className="flex items-center gap-2">
                              <ViewerIcon className="h-3 w-3" /> Viewer
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {user.email_confirmed_at ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            <XCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(user.last_sign_in_at)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(user.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedUser(user)}
                          data-testid={`button-view-user-${user.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setUserToDelete(user)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {searchQuery ? 'No users match your search' : 'No users found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View detailed information about this user</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || undefined} alt={selectedUser.email} />
                  <AvatarFallback className="text-lg">{selectedUser.email.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.name || selectedUser.email.split('@')[0]}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <p className="font-mono text-xs break-all">{selectedUser.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p className="capitalize">{selectedUser.role || 'No role assigned'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Auth Provider</Label>
                  <p className="capitalize">{selectedUser.provider}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p>{selectedUser.phone || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email Verified</Label>
                  <p>{selectedUser.email_confirmed_at ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Joined</Label>
                  <p>{formatDate(selectedUser.created_at)}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Last Sign In</Label>
                  <p>{selectedUser.last_sign_in_at ? formatDate(selectedUser.last_sign_in_at) : 'Never signed in'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.email}</strong>? 
              This action cannot be undone. The user will be permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new user to your application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                data-testid="input-invite-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger data-testid="select-invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)} disabled={inviting}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} disabled={inviting} data-testid="button-send-invite">
              {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
