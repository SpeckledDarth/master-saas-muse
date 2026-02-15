'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Search, Users, Eye, Trash2, UserPlus, Download, Mail, Calendar, Clock, Shield, CheckCircle, XCircle, Crown, UserCog, User, Eye as ViewerIcon, ExternalLink, MessageSquare, FileText, StickyNote, Plus, CreditCard, UserCheck } from 'lucide-react'
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
  stripe_customer_id: string | null
  has_subscription: boolean
}

interface UserDetail {
  user: {
    id: string; email: string; name: string | null; avatar_url: string | null;
    provider: string; created_at: string; last_sign_in_at: string | null; email_confirmed_at: string | null;
  }
  subscription: {
    status: string; tier: string; planName: string | null; amount: number;
    currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; subscriptionId: string | null;
  }
  invoices: Array<{
    id: string; amount_paid: number; status: string; created: string;
    invoice_url: string | null; hosted_invoice_url: string | null;
  }>
  notes: Array<{
    id: number; note: string; created_by_email: string; created_at: string;
  }>
  stripeCustomerId: string | null
  stripePortalUrl: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null)
  const [impersonating, setImpersonating] = useState<string | null>(null)
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

  const loadUserDetail = useCallback(async (userId: string) => {
    setDetailLoading(true)
    setUserDetail(null)
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      const data = await response.json()
      if (response.ok) {
        setUserDetail(data)
      } else {
        toast({ title: 'Failed to load user details', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Failed to load user details', description: 'Please try again', variant: 'destructive' })
    } finally {
      setDetailLoading(false)
    }
  }, [toast])

  function handleViewUser(user: UserWithRole) {
    setSelectedUser(user)
    loadUserDetail(user.id)
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

  async function handleAddNote() {
    if (!newNote.trim() || !selectedUser) return
    setAddingNote(true)
    try {
      const response = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, note: newNote })
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: 'Note added' })
        setNewNote('')
        loadUserDetail(selectedUser.id)
      } else {
        toast({ title: 'Failed to add note', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Failed to add note', description: 'Please try again', variant: 'destructive' })
    } finally {
      setAddingNote(false)
    }
  }

  async function handleDeleteNote(noteId: number) {
    if (!selectedUser) return
    setDeletingNoteId(noteId)
    try {
      const response = await fetch(`/api/admin/notes?noteId=${noteId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: 'Note deleted' })
        loadUserDetail(selectedUser.id)
      } else {
        toast({ title: 'Failed to delete note', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Failed to delete note', description: 'Please try again', variant: 'destructive' })
    } finally {
      setDeletingNoteId(null)
    }
  }

  async function handleImpersonate(userId: string) {
    setImpersonating(userId)
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: 'Impersonation started', description: `Now viewing as ${data.targetUser.email}` })
        window.location.href = '/'
      } else {
        toast({ title: 'Failed to impersonate', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Failed to impersonate', description: 'Please try again', variant: 'destructive' })
    } finally {
      setImpersonating(null)
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
    <div className="py-8 px-6">
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
                  <TableHead className="hidden md:table-cell">Plan</TableHead>
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
                      {user.has_subscription ? (
                        <Badge variant="outline" className="text-green-600 border-green-600" data-testid={`badge-plan-${user.id}`}>
                          <CreditCard className="h-3 w-3 mr-1" />
                          Subscribed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" data-testid={`badge-plan-${user.id}`}>
                          Free
                        </Badge>
                      )}
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
                          onClick={() => handleViewUser(user)}
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {searchQuery ? 'No users match your search' : 'No users found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) { setSelectedUser(null); setUserDetail(null); setNewNote(''); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View detailed information about this user</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" data-testid="loader-user-detail" />
            </div>
          ) : userDetail ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full" data-testid="tabs-user-detail">
                <TabsTrigger value="overview" className="flex-1" data-testid="tab-overview">
                  <User className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="invoices" className="flex-1" data-testid="tab-invoices">
                  <FileText className="h-4 w-4 mr-2" />
                  Invoices
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex-1" data-testid="tab-notes">
                  <StickyNote className="h-4 w-4 mr-2" />
                  Notes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={userDetail.user.avatar_url || undefined} alt={userDetail.user.email} />
                    <AvatarFallback className="text-lg">{userDetail.user.email.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg" data-testid="text-user-name">{userDetail.user.name || userDetail.user.email.split('@')[0]}</h3>
                    <p className="text-muted-foreground" data-testid="text-user-email">{userDetail.user.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">User ID</Label>
                    <p className="font-mono text-xs break-all" data-testid="text-user-id">{userDetail.user.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Role</Label>
                    <p className="capitalize" data-testid="text-user-role">{selectedUser?.role || 'No role assigned'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Auth Provider</Label>
                    <p className="capitalize" data-testid="text-user-provider">{userDetail.user.provider}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p data-testid="text-user-phone">{selectedUser?.phone || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email Verified</Label>
                    <p data-testid="text-user-verified">{userDetail.user.email_confirmed_at ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Joined</Label>
                    <p data-testid="text-user-joined">{formatDate(userDetail.user.created_at)}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Last Sign In</Label>
                    <p data-testid="text-user-last-signin">{userDetail.user.last_sign_in_at ? formatDate(userDetail.user.last_sign_in_at) : 'Never signed in'}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Subscription
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Plan</Label>
                      <div className="mt-1">
                        <Badge variant={userDetail.subscription.tier !== 'free' ? 'default' : 'secondary'} data-testid="badge-subscription-tier">
                          {userDetail.subscription.tier.charAt(0).toUpperCase() + userDetail.subscription.tier.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <p className="capitalize" data-testid="text-subscription-status">{userDetail.subscription.status}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Renewal Date</Label>
                      <p data-testid="text-subscription-renewal">{formatDate(userDetail.subscription.currentPeriodEnd)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Cancel at Period End</Label>
                      <p data-testid="text-subscription-cancel">{userDetail.subscription.cancelAtPeriodEnd ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!userDetail.stripePortalUrl}
                    onClick={() => userDetail.stripePortalUrl && window.open(userDetail.stripePortalUrl, '_blank')}
                    data-testid="button-manage-stripe"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage in Stripe
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    data-testid="button-send-email"
                  >
                    <a href={`mailto:${userDetail.user.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedUser && handleImpersonate(selectedUser.id)}
                    disabled={impersonating === selectedUser?.id}
                    data-testid="button-impersonate-user"
                  >
                    {impersonating === selectedUser?.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserCheck className="h-4 w-4 mr-2" />
                    )}
                    Impersonate User
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="invoices" className="mt-4">
                {!userDetail.stripeCustomerId ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-stripe-customer">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No Stripe customer</p>
                  </div>
                ) : userDetail.invoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-invoices">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No invoices found</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userDetail.invoices.map((invoice) => (
                          <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                            <TableCell data-testid={`text-invoice-date-${invoice.id}`}>
                              {formatDate(invoice.created)}
                            </TableCell>
                            <TableCell data-testid={`text-invoice-amount-${invoice.id}`}>
                              ${(invoice.amount_paid / 100).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                                data-testid={`badge-invoice-status-${invoice.id}`}
                              >
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {invoice.hosted_invoice_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  data-testid={`link-invoice-${invoice.id}`}
                                >
                                  <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View
                                  </a>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-4 space-y-4">
                <div className="space-y-3">
                  {userDetail.notes.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground" data-testid="text-no-notes">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No notes yet</p>
                    </div>
                  ) : (
                    userDetail.notes.map((note) => (
                      <div key={note.id} className="border rounded-md p-3 space-y-1" data-testid={`note-${note.id}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm" data-testid={`text-note-content-${note.id}`}>{note.note}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={deletingNoteId === note.id}
                            className="text-destructive hover:text-destructive shrink-0"
                            data-testid={`button-delete-note-${note.id}`}
                          >
                            {deletingNoteId === note.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground" data-testid={`text-note-meta-${note.id}`}>
                          {note.created_by_email} &middot; {formatDate(note.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <Label htmlFor="new-note">Add a note</Label>
                  <Textarea
                    id="new-note"
                    placeholder="Write a note about this user..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="resize-none"
                    data-testid="textarea-new-note"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    data-testid="button-add-note"
                  >
                    {addingNote ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add Note
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
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
