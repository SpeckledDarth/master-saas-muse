import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }
  
  const { count } = await supabase
    .from('user_roles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin');
  
  if (count && count > 0) {
    return NextResponse.json(
      { error: 'An admin already exists. Bootstrap is only available for new installations.' },
      { status: 400 }
    );
  }
  
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  
  if (existingRole) {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: 'admin' })
      .eq('user_id', user.id);
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  } else {
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'admin',
        app_id: 'default',
      });
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }
  
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'admin_bootstrapped',
    target_type: 'user',
    target_id: user.id,
    details: { email: user.email },
  });
  
  return NextResponse.json({ success: true });
}
