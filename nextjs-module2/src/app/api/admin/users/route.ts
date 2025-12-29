import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (roleData?.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  
  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role, created_at')
    .order('created_at', { ascending: false });
  
  if (!roles) {
    return NextResponse.json({ users: [] });
  }
  
  try {
    const adminClient = createAdminClient();
    const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers();
    
    const usersWithRoles = roles.map(role => {
      const authUser = authUsers?.find(u => u.id === role.user_id);
      return {
        id: role.user_id,
        email: authUser?.email || 'Unknown',
        created_at: role.created_at,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        role: role.role,
      };
    });
    
    return NextResponse.json({ users: usersWithRoles });
  } catch (error) {
    const usersWithRoles = roles.map(role => ({
      id: role.user_id,
      email: role.user_id.substring(0, 8) + '...',
      created_at: role.created_at,
      last_sign_in_at: null,
      role: role.role,
    }));
    
    return NextResponse.json({ 
      users: usersWithRoles,
      warning: 'Could not fetch user emails. SUPABASE_SERVICE_ROLE_KEY may not be configured.'
    });
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (roleData?.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  
  const body = await request.json();
  const { userId, newRole } = body;
  
  if (!userId || !newRole) {
    return NextResponse.json({ error: 'Missing userId or newRole' }, { status: 400 });
  }
  
  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
  }
  
  if (newRole === 'member') {
    const { count } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');
    
    const { data: targetRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (targetRole?.role === 'admin' && count === 1) {
      return NextResponse.json({ error: 'Cannot demote the last admin' }, { status: 400 });
    }
  }
  
  const { error } = await supabase
    .from('user_roles')
    .update({ role: newRole })
    .eq('user_id', userId);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'role_changed',
    target_type: 'user',
    target_id: userId,
    details: { newRole },
  });
  
  return NextResponse.json({ success: true });
}
