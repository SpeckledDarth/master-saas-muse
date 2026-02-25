import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: teamMember } = await adminClient
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', 1)
      .maybeSingle();

    const isAdmin = userRole?.role === 'admin' || teamMember?.role === 'owner' || teamMember?.role === 'manager';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await params;

    const { data: invoice, error } = await adminClient
      .from('invoices')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      if (error.message?.includes('Could not find') || error.code === '42P01') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw error;
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const { data: items } = await adminClient
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ invoice, items: items || [] });
  } catch (error: any) {
    console.error('[Admin Invoice Detail API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}
