'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export default function AuditLogs() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    async function loadLogs() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role !== 'admin') {
        router.push('/profile');
        return;
      }

      const { data: logsData } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsData) {
        setLogs(logsData);
      }

      setLoading(false);
    }

    loadLogs();
  }, [router]);

  function getActionBadgeVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (action) {
      case 'role_changed':
        return 'default';
      case 'settings_updated':
        return 'secondary';
      case 'admin_bootstrapped':
        return 'outline';
      default:
        return 'secondary';
    }
  }

  function formatAction(action: string): string {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
        <h1 className="text-3xl font-bold mb-2" data-testid="text-audit-title">Audit Logs</h1>
        <p className="text-muted-foreground">View history of admin actions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>{logs.length} log entries</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No audit logs yet</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-4 border rounded-md"
                  data-testid={`row-audit-${log.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {formatAction(log.action)}
                      </Badge>
                      {log.target_type && (
                        <span className="text-sm text-muted-foreground">
                          on {log.target_type}
                        </span>
                      )}
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
