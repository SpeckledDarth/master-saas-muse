'use client'

import { useState, useEffect, useMemo } from 'react'
import { DSCard, DSCardContent, DSCardDescription, DSCardHeader, DSCardTitle } from '@/components/ui/ds-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { Users, Mail, UserPlus, Trash2, Shield, User, Crown, Info, ChevronDown, ChevronUp, RotateCw } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AdminDataTable, ColumnDef } from '@/components/admin/data-table'
import { TableToolbar } from '@/components/admin/table-toolbar'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { RelativeTime } from '@/lib/format-relative-time'

interface TeamMember {
  id: number
  user_id: string
  role: 'owner' | 'manager' | 'member' | 'viewer'
  joined_at: string
  email: string
  name: string
  avatar?: string
}

interface Invitation {
  id: number
  email: string
  role: string
  expires_at: string
  created_at: string
}

interface UserPermissions {
  isAppAdmin: boolean
  teamRole: string | null
  canManageTeam: boolean
  canInviteMembers: boolean
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [rolesInfoOpen, setRolesInfoOpen] = useState(false)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [memberSearch, setMemberSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [confirmRemove, setConfirmRemove] = useState<{ open: boolean; memberId: number | null; name: string }>({ open: false, memberId: null, name: '' })
  const [confirmCancel, setConfirmCancel] = useState<{ open: boolean; invitationId: number | null; email: string }>({ open: false, invitationId: null, email: '' })
  const [removingMember, setRemovingMember] = useState(false)
  const [cancellingInvite, setCancellingInvite] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [membersRes, invitationsRes, permissionsRes] = await Promise.all([
        fetch('/api/admin/team'),
        fetch('/api/admin/invitations'),
        fetch('/api/user/membership')
      ])

      const membersData = await membersRes.json()
      const invitationsData = await invitationsRes.json()
      const permissionsData = await permissionsRes.json()

      setMembers(membersData.members || [])
      setInvitations(invitationsData.invitations || [])

      const isOwner = permissionsData.isAppAdmin || permissionsData.teamRole === 'owner'
      const isManager = permissionsData.teamRole === 'manager'
      setPermissions({
        isAppAdmin: permissionsData.isAppAdmin,
        teamRole: permissionsData.teamRole,
        canManageTeam: isOwner,
        canInviteMembers: isOwner || isManager
      })
    } catch (error) {
      console.error('Error fetching team data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite() {
    if (!inviteEmail) return
    setSending(true)

    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invite', email: inviteEmail, role: inviteRole })
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'Invitation sent', description: `Invitation sent to ${inviteEmail}` })
        setInviteEmail('')
        setInviteDialogOpen(false)
        fetchData()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to send invitation', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send invitation', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  async function handleUpdateRole(memberId: number, newRole: string) {
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_role', memberId, role: newRole })
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'Role updated' })
        fetchData()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update role',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' })
    }
  }

  async function handleRemoveMember() {
    if (!confirmRemove.memberId) return
    setRemovingMember(true)

    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', memberId: confirmRemove.memberId })
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'Member removed' })
        fetchData()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to remove member',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove member', variant: 'destructive' })
    } finally {
      setRemovingMember(false)
      setConfirmRemove({ open: false, memberId: null, name: '' })
    }
  }

  async function handleCancelInvitation() {
    if (!confirmCancel.invitationId) return
    setCancellingInvite(true)

    try {
      const res = await fetch(`/api/admin/invitations?id=${confirmCancel.invitationId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast({ title: 'Invitation cancelled' })
        fetchData()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to cancel invitation', variant: 'destructive' })
    } finally {
      setCancellingInvite(false)
      setConfirmCancel({ open: false, invitationId: null, email: '' })
    }
  }

  async function handleResendInvitation(invitationId: number) {
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend', invitationId })
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'Invitation resent', description: 'A new invitation email has been sent' })
        fetchData()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to resend invitation', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to resend invitation', variant: 'destructive' })
    }
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />
      case 'manager': return <Shield className="h-4 w-4" />
      case 'viewer': return <User className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  function getRoleBadgeVariant(role: string) {
    switch (role) {
      case 'owner': return 'default'
      case 'manager': return 'secondary'
      default: return 'outline'
    }
  }

  const filteredMembers = useMemo(() => {
    let result = members
    if (memberSearch) {
      const q = memberSearch.toLowerCase()
      result = result.filter(m =>
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== 'all') {
      result = result.filter(m => m.role === roleFilter)
    }
    return result
  }, [members, memberSearch, roleFilter])

  const memberColumns: ColumnDef<TeamMember>[] = useMemo(() => [
    {
      id: 'member',
      header: 'Member',
      accessorFn: (row) => (
        <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
          <Avatar>
            <AvatarImage src={row.avatar} />
            <AvatarFallback>
              {row.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium" data-testid={`text-member-name-${row.id}`}>{row.name}</p>
            <p className="text-sm text-muted-foreground" data-testid={`text-member-email-${row.id}`}>{row.email}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.name?.toLowerCase() || '',
    },
    {
      id: 'role',
      header: 'Role',
      accessorFn: (row) => (
        <Badge variant={getRoleBadgeVariant(row.role) as any} className="flex items-center gap-1 w-fit">
          {getRoleIcon(row.role)}
          {row.role}
        </Badge>
      ),
      sortable: true,
      sortValue: (row) => row.role,
    },
    {
      id: 'joined',
      header: 'Joined',
      accessorFn: (row) => <RelativeTime date={row.joined_at} />,
      sortable: true,
      sortValue: (row) => row.joined_at || '',
      hideOnMobile: true,
    },
    {
      id: 'actions',
      header: '',
      accessorFn: (row) => {
        if (row.role === 'owner' || !permissions?.canManageTeam) return null
        return (
          <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
            <Select
              value={row.role}
              onValueChange={(value) => handleUpdateRole(row.id, value)}
            >
              <SelectTrigger className="w-28" data-testid={`select-role-${row.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setConfirmRemove({ open: true, memberId: row.id, name: row.name })}
              data-testid={`button-remove-${row.id}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )
      },
      className: 'text-right',
    },
  ], [permissions])

  const invitationColumns: ColumnDef<Invitation>[] = useMemo(() => [
    {
      id: 'email',
      header: 'Email',
      accessorFn: (row) => (
        <p className="font-medium" data-testid={`text-invite-email-${row.id}`}>{row.email}</p>
      ),
      sortable: true,
      sortValue: (row) => row.email.toLowerCase(),
    },
    {
      id: 'role',
      header: 'Role',
      accessorFn: (row) => <Badge variant="outline">{row.role}</Badge>,
      sortable: true,
      sortValue: (row) => row.role,
    },
    {
      id: 'sent',
      header: 'Sent',
      accessorFn: (row) => <RelativeTime date={row.created_at} />,
      sortable: true,
      sortValue: (row) => row.created_at || '',
      hideOnMobile: true,
    },
    {
      id: 'expires',
      header: 'Expires',
      accessorFn: (row) => <RelativeTime date={row.expires_at} />,
      sortable: true,
      sortValue: (row) => row.expires_at || '',
      hideOnMobile: true,
    },
    {
      id: 'actions',
      header: '',
      accessorFn: (row) => {
        if (!permissions?.canInviteMembers) return null
        return (
          <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResendInvitation(row.id)}
              data-testid={`button-resend-invite-${row.id}`}
            >
              <RotateCw className="h-3 w-3 mr-1" />
              Resend
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmCancel({ open: true, invitationId: row.id, email: row.email })}
              data-testid={`button-cancel-invite-${row.id}`}
            >
              Cancel
            </Button>
          </div>
        )
      },
      className: 'text-right',
    },
  ], [permissions])

  return (
    <div className="p-[var(--section-spacing,1.5rem)] space-y-[var(--content-density-gap,1rem)]">
      <div className="flex items-center justify-between gap-[var(--content-density-gap,1rem)]">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Users className="h-6 w-6" />
            Team Management
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">Manage your team members and invitations</p>
        </div>

        {permissions?.canInviteMembers && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-invite-member">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-[var(--content-density-gap,1rem)] py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  data-testid="input-invite-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger data-testid="select-invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleInvite} disabled={sending || !inviteEmail} data-testid="button-send-invite">
                {sending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Collapsible open={rolesInfoOpen} onOpenChange={setRolesInfoOpen}>
        <DSCard>
          <CollapsibleTrigger asChild>
            <DSCardHeader className="cursor-pointer hover-elevate active-elevate-2">
              <DSCardTitle className="flex items-center justify-between gap-[var(--content-density-gap,1rem)]">
                <span className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Role Permissions Reference
                </span>
                {rolesInfoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </DSCardTitle>
              <DSCardDescription>Click to see what each team role can do</DSCardDescription>
            </DSCardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <DSCardContent className="pt-0">
              <div className="grid gap-[var(--content-density-gap,1rem)] md:grid-cols-2">
                <div className="p-[var(--card-padding,1.25rem)] border rounded-[var(--card-radius,0.75rem)] space-y-2">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-[hsl(var(--warning))]" />
                    <span className="font-semibold">Owner</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Full access to all features</li>
                    <li>Manage team members and roles</li>
                    <li>Access billing and subscription settings</li>
                    <li>Edit all app settings and branding</li>
                    <li>Cannot be removed from the team</li>
                  </ul>
                </div>
                <div className="p-[var(--card-padding,1.25rem)] border rounded-[var(--card-radius,0.75rem)] space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[hsl(var(--info))]" />
                    <span className="font-semibold">Manager</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Create, edit, and publish content</li>
                    <li>View dashboard analytics</li>
                    <li>Invite new team members</li>
                    <li>Manage user accounts</li>
                    <li>Cannot access billing or app settings</li>
                  </ul>
                </div>
                <div className="p-[var(--card-padding,1.25rem)] border rounded-[var(--card-radius,0.75rem)] space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[hsl(var(--success))]" />
                    <span className="font-semibold">Member</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>View dashboard and analytics</li>
                    <li>Create and edit content</li>
                    <li>View team member list</li>
                    <li>Cannot manage users or invite members</li>
                    <li>Cannot access billing or app settings</li>
                  </ul>
                </div>
                <div className="p-[var(--card-padding,1.25rem)] border rounded-[var(--card-radius,0.75rem)] space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Viewer</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>No admin dashboard access</li>
                    <li>Can view public content only</li>
                    <li>Team member without operational access</li>
                    <li>Useful for stakeholders who need visibility</li>
                  </ul>
                </div>
              </div>
            </DSCardContent>
          </CollapsibleContent>
        </DSCard>
      </Collapsible>

      <div className="space-y-[var(--content-density-gap,1rem)]">
        <h2 className="text-lg font-semibold" data-testid="text-members-heading">Team Members ({members.length})</h2>
        <TableToolbar
          search={memberSearch}
          onSearchChange={setMemberSearch}
          searchPlaceholder="Search members..."
          filters={[
            {
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
            },
          ]}
          csvExport={{
            filename: 'team-members',
            headers: ['Name', 'Email', 'Role', 'Joined'],
            getRows: () => members.map(m => [m.name, m.email, m.role, m.joined_at || '']),
          }}
          data-testid="members-toolbar"
        />
        <AdminDataTable
          columns={memberColumns}
          data={filteredMembers}
          loading={loading}
          emptyMessage="No team members yet"
          emptyDescription="Invite someone to get started! Use the Invite Member button above."
          getRowId={(row) => String(row.id)}
          data-testid="members-table"
        />
      </div>

      <div className="space-y-[var(--content-density-gap,1rem)]">
        <h2 className="text-lg font-semibold flex items-center gap-2" data-testid="text-invitations-heading">
          <Mail className="h-5 w-5" />
          Pending Invitations ({invitations.length})
        </h2>
        <AdminDataTable
          columns={invitationColumns}
          data={invitations}
          loading={loading}
          emptyMessage="No pending invitations"
          emptyDescription="All invitations have been accepted or there are none yet."
          getRowId={(row) => String(row.id)}
          data-testid="invitations-table"
        />
      </div>

      <ConfirmDialog
        open={confirmRemove.open}
        onOpenChange={(open) => { if (!open) setConfirmRemove({ open: false, memberId: null, name: '' }) }}
        title="Remove Team Member"
        description={`Are you sure you want to remove ${confirmRemove.name} from the team? They will lose access immediately.`}
        confirmLabel="Remove"
        variant="destructive"
        loading={removingMember}
        onConfirm={handleRemoveMember}
      />

      <ConfirmDialog
        open={confirmCancel.open}
        onOpenChange={(open) => { if (!open) setConfirmCancel({ open: false, invitationId: null, email: '' }) }}
        title="Cancel Invitation"
        description={`Are you sure you want to cancel the invitation to ${confirmCancel.email}? The invitation link will no longer work.`}
        confirmLabel="Cancel Invitation"
        variant="destructive"
        loading={cancellingInvite}
        onConfirm={handleCancelInvitation}
      />
    </div>
  )
}
