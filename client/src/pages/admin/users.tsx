import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Shield, User as UserIcon } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface UserWithRole {
  id: number;
  userId: string;
  role: string;
  assignedAt: string;
}

export default function UserManagement() {
  const { user: currentUser, isAdmin } = useAuth();
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery<UserWithRole[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/metrics"] });
      toast({
        title: "Role updated",
        description: "User role has been changed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin access to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (userId: string) => {
    return userId.slice(0, 2).toUpperCase();
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="admin-users-page">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" data-testid="link-back-to-admin">
          <Button variant="ghost" size="icon" data-testid="button-back-to-admin">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">View and manage user accounts and roles</p>
        </div>
      </div>

      <Card data-testid="card-users-list">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : `${users?.length ?? 0} registered users`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <div className="space-y-4">
              {users.map((u) => (
                <div
                  key={u.userId}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-md bg-muted/30"
                  data-testid={`user-row-${u.userId}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(u.userId)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium" data-testid={`text-user-id-${u.userId}`}>
                        User ID: {u.userId.slice(0, 8)}...
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-user-joined-${u.userId}`}>
                        Joined: {new Date(u.assignedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {u.userId === currentUser?.id && (
                      <Badge variant="secondary">You</Badge>
                    )}
                    
                    <Select
                      value={u.role}
                      onValueChange={(role) => updateRoleMutation.mutate({ userId: u.userId, role })}
                      disabled={u.userId === currentUser?.id || updateRoleMutation.isPending}
                    >
                      <SelectTrigger 
                        className="w-28" 
                        data-testid={`select-role-${u.userId}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-3 w-3" />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-3 w-3" />
                            Member
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No users found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
