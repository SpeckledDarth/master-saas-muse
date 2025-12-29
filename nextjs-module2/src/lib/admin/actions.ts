'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UserRole, OrganizationSettings, AdminMetrics, AuditLog } from '@/lib/types/admin';

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  return data?.role || null;
}

export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'admin';
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = await createClient();
  
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
  
  return {
    totalUsers: totalUsers || 0,
    totalAdmins: totalAdmins || 0,
    totalMembers: (totalUsers || 0) - (totalAdmins || 0),
    recentSignups: recentSignups || 0,
  };
}

export async function getOrganizationSettings(): Promise<OrganizationSettings | null> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('organization_settings')
    .select('*')
    .eq('app_id', 'default')
    .single();
  
  return data;
}

export async function updateOrganizationSettings(
  settings: Partial<OrganizationSettings>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('organization_settings')
    .update(settings)
    .eq('app_id', 'default');
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  await createAuditLog({
    action: 'settings_updated',
    targetType: 'organization_settings',
    targetId: 'default',
    details: settings,
  });
  
  revalidatePath('/admin/settings');
  return { success: true };
}

export async function createAuditLog(params: {
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from('audit_logs').insert({
    user_id: user?.id,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    details: params.details || {},
  });
}

export async function getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return data || [];
}
