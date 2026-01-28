'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UserWithRole {
  id: string
  email: string
  created_at: string
  role: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function loadUsers() {
      const supabase = createClient()
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          created_at,
          user_roles (role)
        `)
        .order('created_at', { ascending: false })
      
      if (!error && profiles) {
        const usersWithRoles = profiles.map((profile: { id: string; email: string; created_at: string; user_roles: { role: string }[] | { role: string } | null }) => ({
          id: profile.id,
          email: profile.email || 'No email',
          created_at: profile.created_at,
          role: Array.isArray(profile.user_roles) 
            ? profile.user_roles[0]?.role || 'member'
            : profile.user_roles?.role || 'member'
        }))
        setUsers(usersWithRoles)
      }
      
      setLoading(false)
    }
    
    loadUsers()
  }, [])

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('user_roles')
      .upsert({ 
        user_id: userId, 
        role: newRole 
      }, { 
        onConflict: 'user_id' 
      })
    
    if (error) {
      toast({
        title: 'Failed to update role',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Role updated',
        description: `User role changed to ${newRole}`,
      })
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ))
    }
    
    setUpdatingRole(null)
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
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
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all users in your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-users"
            />
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                      disabled={updatingRole === user.id}
                    >
                      <SelectTrigger className="w-[120px]" data-testid={`select-role-${user.id}`}>
                        {updatingRole === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    {searchQuery ? 'No users match your search' : 'No users found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
