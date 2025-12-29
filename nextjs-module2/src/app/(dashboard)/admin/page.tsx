'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Users, Settings, Shield, Activity, UserPlus } from 'lucide-react';

interface AdminMetrics {
  totalUsers: number;
  totalAdmins: number;
  totalMembers: number;
  recentSignups: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    async function checkAdminAndLoadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

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

      setIsAdmin(true);

      const { count: totalUsers } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });

      const { count: totalAdmins } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentSignups } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      setMetrics({
        totalUsers: totalUsers || 0,
        totalAdmins: totalAdmins || 0,
        totalMembers: (totalUsers || 0) - (totalAdmins || 0),
        recentSignups: recentSignups || 0,
      });

      setLoading(false);
    }

    checkAdminAndLoadData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-admin-title">Admin Dashboard</h1>
        <p className="text-muted-foreground" data-testid="text-admin-email">
          Logged in as: {userEmail}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card data-testid="card-total-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-admins">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalAdmins || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-members">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalMembers || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-recent-signups">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Recent Signups (7d)</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.recentSignups || 0}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/users" data-testid="link-admin-users">
          <Card className="hover-elevate cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>View and manage user accounts and roles</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/settings" data-testid="link-admin-settings">
          <Card className="hover-elevate cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </CardTitle>
              <CardDescription>Configure app settings and feature flags</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/audit" data-testid="link-admin-audit">
          <Card className="hover-elevate cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Audit Logs
              </CardTitle>
              <CardDescription>View admin action history</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
