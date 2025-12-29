export type UserRole = 'admin' | 'member';

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  app_id: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  id: string;
  app_id: string;
  organization_name: string;
  support_email: string;
  allow_signups: boolean;
  maintenance_mode: boolean;
  require_email_verification: boolean;
  enable_google_signin: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: UserRole;
  role_id: string;
}

export interface AdminMetrics {
  totalUsers: number;
  totalAdmins: number;
  totalMembers: number;
  recentSignups: number;
}
