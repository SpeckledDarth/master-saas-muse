import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Settings, FileText, Shield, Activity, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface AdminMetrics {
  totalUsers: number;
  adminUsers: number;
  memberUsers: number;
  recentSignups: number;
}

interface AuditLog {
  id: number;
  userId: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, isAdmin, bootstrapAdmin, refreshRole } = useAuth();
  const { toast } = useToast();

  const { data: metrics, isLoading: metricsLoading } = useQuery<AdminMetrics>({
    queryKey: ["/api/admin/metrics"],
    enabled: isAdmin,
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs"],
    enabled: isAdmin,
  });

  const bootstrapMutation = useMutation({
    mutationFn: () => bootstrapAdmin(),
    onSuccess: async () => {
      await refreshRole();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/metrics"] });
      toast({
        title: "Admin access granted",
        description: "You are now the first admin of this application.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bootstrap failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background" data-testid="admin-not-authenticated">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <Link href="/" data-testid="link-home">
              <span className="font-bold text-lg">Master SaaS Muse</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/auth/login" data-testid="link-login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup" data-testid="link-signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">Please sign in to access the admin panel.</p>
              <Link href="/auth/login" data-testid="link-go-to-login">
                <Button data-testid="button-go-to-login">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background" data-testid="admin-bootstrap-prompt">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <Link href="/" data-testid="link-home">
              <span className="font-bold text-lg">Master SaaS Muse</span>
            </Link>
            <Link href="/dashboard" data-testid="link-dashboard">
              <Button variant="ghost">My Dashboard</Button>
            </Link>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
              <p className="text-muted-foreground mb-4">
                You don't have admin access yet. If this is a new installation,
                you can bootstrap yourself as the first admin.
              </p>
              <Button 
                onClick={() => bootstrapMutation.mutate()}
                disabled={bootstrapMutation.isPending}
                data-testid="button-bootstrap-admin"
              >
                {bootstrapMutation.isPending ? "Setting up..." : "Become First Admin"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-dashboard">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" data-testid="link-home">
            <span className="font-bold text-lg">Master SaaS Muse</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" data-testid="link-user-dashboard">
              <Button variant="ghost">My Profile</Button>
            </Link>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, settings, and monitor activity</p>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card data-testid="metric-total-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-users">
                {metrics?.totalUsers ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="metric-admins">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-admin-count">
                {metrics?.adminUsers ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="metric-members">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-member-count">
                {metrics?.memberUsers ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="metric-recent-signups">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-recent-signups">
                {metrics?.recentSignups ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link href="/admin/users" data-testid="link-admin-users">
          <Card className="hover-elevate cursor-pointer" data-testid="card-user-management">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage users</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/settings" data-testid="link-admin-settings">
          <Card className="hover-elevate cursor-pointer" data-testid="card-settings">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-lg">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Application configuration</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Card data-testid="card-audit-logs-preview">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Recent activity</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card data-testid="section-recent-activity">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest audit log entries</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : auditLogs && auditLogs.length > 0 ? (
            <div className="space-y-4">
              {auditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
                  data-testid={`audit-log-${log.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {log.action}
                    </Badge>
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {log.userId}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No activity yet</p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
