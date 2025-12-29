'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Shield, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'member';

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: UserRole;
}

export default function UserManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setCurrentUserId(user.id);
      setUserEmail(user.email || '');

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role !== 'admin') {
        router.push('/profile');
        return;
      }

      try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        
        if (data.error) {
          toast({
            title: 'Error',
            description: data.error,
            variant: 'destructive',
          });
          return;
        }
        
        setUsers(data.users || []);
        
        if (data.warning) {
          toast({
            title: 'Warning',
            description: data.warning,
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load users',
          variant: 'destructive',
        });
      }

      setLoading(false);
    }

    loadUsers();
  }, [router, toast]);

  async function handleRoleChange(userId: string, newRole: UserRole) {
    if (userId === currentUserId) {
      toast({
        title: 'Error',
        description: 'You cannot change your own role',
        variant: 'destructive',
      });
      return;
    }

    setUpdating(userId);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
      } else {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        ));

        toast({
          title: 'Success',
          description: 'User role updated successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    }

    setUpdating(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/admin" data-testid="link-back-admin">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-users-title">User Management</h1>
        <p className="text-muted-foreground" data-testid="text-current-admin">
          Currently logged in as: {userEmail}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>{users.length} users registered</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-md"
                data-testid={`row-user-${user.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {user.role === 'admin' ? (
                      <Shield className="h-5 w-5 text-primary" />
                    ) : (
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium" data-testid={`text-email-${user.id}`}>{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.id === currentUserId ? (
                    <span className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded">
                      {user.role} (you)
                    </span>
                  ) : (
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                      disabled={updating === user.id}
                    >
                      <SelectTrigger 
                        className="w-32" 
                        data-testid={`select-role-${user.id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
