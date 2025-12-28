import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Settings, Users, Database, ShieldAlert } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Admin Console</h1>
          <p className="text-muted-foreground">Manage system-wide settings and users</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">View and manage all registered users, roles, and permissions.</p>
              <Button variant="outline" className="w-full">Manage Users</Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded-lg">
                <Database className="w-6 h-6" />
              </div>
              <CardTitle>Database</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Monitor database health, connections, and perform backups.</p>
              <Button variant="outline" className="w-full">View Metrics</Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <CardTitle>Security Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Review system access logs, failed logins, and security alerts.</p>
              <Button variant="outline" className="w-full">View Logs</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
