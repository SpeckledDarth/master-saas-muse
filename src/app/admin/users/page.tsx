'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Users, Eye, Trash2, UserPlus, Mail, Clock, Crown, UserCog, User, Eye as ViewerIcon, ExternalLink, MessageSquare, FileText, StickyNote, Plus, CreditCard, UserCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AdminDataTable, ColumnDef } from '@/components/admin/data-table'
import { TableToolbar, FilterDef } from '@/components/admin/table-toolbar'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { formatRelativeTime, formatAbsoluteTime } from '@/lib/format-relative-time'

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

function HealthDot({ user }: { user: UserWithRole }) {
  const now = Date.now()
  const lastLogin = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0
  const daysSinceLogin = lastLogin ? Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24)) : Infinity

  if (user.has_subscription) {
    return (
      <span
        className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--success))]"
        title="Subscribed"
        data-testid={`health-dot-${user.id}`}
      />
    )
  }

  if (!user.email_confirmed_at) {
    return (
      <span
        className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--warning))]"
        title="Email pending verification"
        data-testid={`health-dot-${user.id}`}
      />
    )
  }

  if (daysSinceLogin > 30) {
    return (
      <span
        className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--danger))]"
        title="Inactive (no login >30 days)"
        data-testid={`health-dot-${user.id}`}
      />
    )
  }

  return (
    <span
      className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--success))]"
      title="Active"
      data-testid={`health-dot-${user.id}`}
    />
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string; currentRole: string; newRole: string } | null>(null)
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
        toast({ title: 'Failed to load users', description: data.error || 'Unknown error', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Failed to load users', description: 'Please try again', variant: 'destructive' })
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

  function handleConfirmRoleChange() {
    if (!pendingRoleChange) return
    const { userId, newRole } = pendingRoleChange
    setPendingRoleChange(null)
    handleRoleChange(userId, newRole)
  }

  async function handleDeleteUser() {
    if (!userToDelete) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/users?userId=${userToDelete.id}`, { method: 'DELETE' })
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
      const response = await fetch(`/api/admin/notes?noteId=${noteId}`, { method: 'DELETE' })
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
        window.location.href = '/dashboard/social/overview'
      } else {
        toast({ title: 'Failed to impersonate', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Failed to impersonate', description: 'Please try again', variant: 'destructive' })
    } finally {
      setImpersonating(null)
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

  const filteredUsers = useMemo(() => {
    let result = users
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(user =>
        user.email.toLowerCase().includes(q) ||
        (user.name && user.name.toLowerCase().includes(q)) ||
        user.id.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== 'all') {
      result = result.filter(user => (user.role || 'member') === roleFilter)
    }
    return result
  }, [users, searchQuery, roleFilter])

  const roleFilterDef: FilterDef = {
    id: 'role',
    label: 'Roles',
    options: [
      { label: 'Owner', value: 'owner' },
      { label: 'Manager', value: 'manager' },
      { label: 'Member', value: 'member' },
      { label: 'Viewer', value: 'viewer' },
    ],
    value: roleFilter,
    onChange: setRoleFilter,
  }

  const columns: ColumnDef<UserWithRole>[] = useMemo(() => [
    {
      id: 'user',
      header: 'User',
      accessorFn: (user) => (
        <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
          <div className="relative">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar_url || undefined} alt={user.email} />
              <AvatarFallback>{user.email.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5">
              <HealthDot user={user} />
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate">{user.name || user.email.split('@')[0]}</span>
            <span className="text-sm text-muted-foreground truncate">{user.email}</span>
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (user) => (user.name || user.email).toLowerCase(),
    },
    {
      id: 'role',
      header: 'Role',
      accessorFn: (user) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={user.role || 'member'}
            onValueChange={(value) => setPendingRoleChange({ userId: user.id, currentRole: user.role || 'member', newRole: value })}
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
        </div>
      ),
    },
    {
      id: 'plan',
      header: 'Plan',
      hideOnMobile: true,
      accessorFn: (user) => user.has_subscription ? (
        <Badge variant="outline" className="text-[hsl(var(--success))] border-[hsl(var(--success))]" data-testid={`badge-plan-${user.id}`}>
          <CreditCard className="h-3 w-3 mr-1" />
          Subscribed
        </Badge>
      ) : (
        <Badge variant="secondary" data-testid={`badge-plan-${user.id}`}>
          Free
        </Badge>
      ),
    },
    {
      id: 'lastActive',
      header: 'Last Active',
      hideOnMobile: true,
      accessorFn: (user) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span title={formatAbsoluteTime(user.last_sign_in_at)}>{formatRelativeTime(user.last_sign_in_at)}</span>
        </div>
      ),
      sortable: true,
      sortValue: (user) => user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0,
    },
    {
      id: 'joined',
      header: 'Joined',
      hideOnMobile: true,
      accessorFn: (user) => (
        <span className="text-muted-foreground">
          <span title={formatAbsoluteTime(user.created_at)}>{formatRelativeTime(user.created_at)}</span>
        </span>
      ),
      sortable: true,
      sortValue: (user) => new Date(user.created_at).getTime(),
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right w-[80px]',
      accessorFn: (user) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
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
            className="text-destructive"
            data-testid={`button-delete-user-${user.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [updatingRole, users])

  return (
    <div className="py-[var(--section-spacing,1.5rem)] px-[var(--section-spacing,1.5rem)] space-y-[var(--content-density-gap,1rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[var(--content-density-gap,1rem)]">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </h1>
          <p className="text-sm text-muted-foreground" data-testid="text-user-count">
            {users.length} total users
          </p>
        </div>
      </div>

      <TableToolbar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by email, name, or ID..."
        filters={[roleFilterDef]}
        csvExport={{
          filename: `users-export-${new Date().toISOString().split('T')[0]}`,
          headers: ['Email', 'Name', 'Role', 'Provider', 'Joined', 'Last Login', 'Email Verified'],
          getRows: () => filteredUsers.map(user => [
            user.email,
            user.name || '',
            user.role || 'No role',
            user.provider,
            new Date(user.created_at).toLocaleDateString(),
            user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never',
            user.email_confirmed_at ? 'Yes' : 'No'
          ]),
        }}
        actions={
          <Button
            size="sm"
            onClick={() => setShowInviteDialog(true)}
            data-testid="button-invite-user"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        }
        data-testid="users-toolbar"
      />

      <AdminDataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        emptyMessage={searchQuery || roleFilter !== 'all' ? 'No users match your filters' : 'No users yet'}
        emptyDescription="Invite your first user to get started."
        onRowClick={handleViewUser}
        getRowId={(user) => user.id}
        pageSize={20}
        data-testid="users-table"
      />

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

              <TabsContent value="overview" className="space-y-[var(--content-density-gap,1rem)] mt-4">
                <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={userDetail.user.avatar_url || undefined} alt={userDetail.user.email} />
                    <AvatarFallback className="text-lg">{userDetail.user.email.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg" data-testid="text-user-name">{userDetail.user.name || userDetail.user.email.split('@')[0]}</h3>
                    <p className="text-muted-foreground" data-testid="text-user-email">{userDetail.user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--content-density-gap,1rem)] text-sm">
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
                    <p data-testid="text-user-joined"><span title={formatAbsoluteTime(userDetail.user.created_at)}>{formatRelativeTime(userDetail.user.created_at)}</span></p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Last Sign In</Label>
                    <p data-testid="text-user-last-signin">
                      <span title={formatAbsoluteTime(userDetail.user.last_sign_in_at)}>{formatRelativeTime(userDetail.user.last_sign_in_at)}</span>
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Subscription
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--content-density-gap,1rem)] text-sm">
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
                  <div className="text-center py-[var(--section-spacing,1.5rem)] text-muted-foreground" data-testid="text-no-stripe-customer">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No Stripe customer</p>
                  </div>
                ) : userDetail.invoices.length === 0 ? (
                  <div className="text-center py-[var(--section-spacing,1.5rem)] text-muted-foreground" data-testid="text-no-invoices">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No invoices found</p>
                  </div>
                ) : (
                  <div className="rounded-[var(--card-radius,0.75rem)] border">
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
                              <span title={formatAbsoluteTime(invoice.created)}>{formatRelativeTime(invoice.created)}</span>
                            </TableCell>
                            <TableCell className="tabular-nums" data-testid={`text-invoice-amount-${invoice.id}`}>
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

              <TabsContent value="notes" className="mt-4 space-y-[var(--content-density-gap,1rem)]">
                <div className="space-y-3">
                  {userDetail.notes.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground" data-testid="text-no-notes">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No notes yet</p>
                    </div>
                  ) : (
                    userDetail.notes.map((note) => (
                      <div key={note.id} className="border rounded-[var(--card-radius,0.75rem)] p-[var(--card-padding,1.25rem)] space-y-1" data-testid={`note-${note.id}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm" data-testid={`text-note-content-${note.id}`}>{note.note}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={deletingNoteId === note.id}
                            className="text-destructive shrink-0"
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
                          {note.created_by_email} &middot; <span title={formatAbsoluteTime(note.created_at)}>{formatRelativeTime(note.created_at)}</span>
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

      <ConfirmDialog
        open={!!userToDelete}
        onOpenChange={(open) => { if (!open) setUserToDelete(null) }}
        title="Delete User"
        description={`Are you sure you want to delete ${userToDelete?.email}? This action cannot be undone. The user will be permanently removed from the system.`}
        confirmLabel="Delete User"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteUser}
      />

      <ConfirmDialog
        open={!!pendingRoleChange}
        onOpenChange={(open) => { if (!open) setPendingRoleChange(null) }}
        title="Change User Role"
        description={`Change role from "${pendingRoleChange?.currentRole}" to "${pendingRoleChange?.newRole}"?`}
        confirmLabel="Change Role"
        onConfirm={handleConfirmRoleChange}
      />

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new user to your application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-[var(--content-density-gap,1rem)]">
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
