'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { Users, Mail, UserPlus, Trash2, Shield, User, Crown, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

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
      
      // Determine permissions based on role
      const isOwner = permissionsData.isAppAdmin || permissionsData.teamRole === 'owner'
      const isManager = permissionsData.teamRole === 'manager'
      setPermissions({
        isAppAdmin: permissionsData.isAppAdmin,
        teamRole: permissionsData.teamRole,
        canManageTeam: isOwner, // Only owners can change roles and remove members
        canInviteMembers: isOwner || isManager // Owners and managers can invite
      })
    } catch (error) {
      console.error('Error fetching team data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite() {
    console.log('[Team Invite] handleInvite called')
    if (!inviteEmail) {
      console.log('[Team Invite] No email, returning')
      return
    }
    setSending(true)
    console.log('[Team Invite] Starting invite for:', inviteEmail, 'role:', inviteRole)
    
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invite', email: inviteEmail, role: inviteRole })
      })
      
      console.log('[Team Invite] Response status:', res.status)
      const data = await res.json()
      console.log('[Team Invite] Response data:', JSON.stringify(data, null, 2))
      
      if (res.ok) {
        toast({ title: 'Invitation sent', description: `Invitation sent to ${inviteEmail}` })
        setInviteEmail('')
        setInviteDialogOpen(false)
        fetchData()
      } else {
        const errorMsg = data.error || 'Failed to send invitation'
        console.error('[Team Invite] Error details:', data.details)
        toast({ title: 'Error', description: errorMsg, variant: 'destructive' })
      }
    } catch (error) {
      console.error('[Team Invite] Error:', error)
      toast({ title: 'Error', description: 'Failed to send invitation', variant: 'destructive' })
    } finally {
      setSending(false)
      console.log('[Team Invite] Complete')
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

  async function handleRemoveMember(memberId: number) {
    if (!confirm('Are you sure you want to remove this team member?')) return
    
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', memberId })
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
    }
  }

  async function handleCancelInvitation(invitationId: number) {
    if (!confirm('Are you sure you want to cancel this invitation?')) return
    
    try {
      const res = await fetch(`/api/admin/invitations?id=${invitationId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        toast({ title: 'Invitation cancelled' })
        fetchData()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to cancel invitation', variant: 'destructive' })
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Team Management
          </h1>
          <p className="text-muted-foreground">Manage your team members and invitations</p>
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
            <div className="space-y-4 py-4">
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
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover-elevate">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Role Permissions Reference
                </span>
                {rolesInfoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CardTitle>
              <CardDescription>Click to see what each team role can do</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
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
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
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
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-500" />
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
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
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
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card>
        <CardHeader>
          <CardTitle>Team Members ({members.length})</CardTitle>
          <CardDescription>People who have access to your application</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No team members yet. Invite someone to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`member-row-${member.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>
                        {member.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={getRoleBadgeVariant(member.role) as any} className="flex items-center gap-1">
                      {getRoleIcon(member.role)}
                      {member.role}
                    </Badge>
                    {member.role !== 'owner' && permissions?.canManageTeam && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleUpdateRole(member.id, value)}
                        >
                          <SelectTrigger className="w-28" data-testid={`select-role-${member.id}`}>
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
                          onClick={() => handleRemoveMember(member.id)}
                          data-testid={`button-remove-${member.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({invitations.length})
            </CardTitle>
            <CardDescription>Invitations waiting to be accepted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                  data-testid={`invitation-row-${invitation.id}`}
                >
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{invitation.role}</Badge>
                    {permissions?.canInviteMembers && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvitation(invitation.id)}
                          data-testid={`button-resend-invite-${invitation.id}`}
                        >
                          Resend
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelInvitation(invitation.id)}
                          data-testid={`button-cancel-invite-${invitation.id}`}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
