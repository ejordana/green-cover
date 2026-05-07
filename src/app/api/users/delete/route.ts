import { NextRequest, NextResponse } from 'next/server';
import { deleteUserAuth } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';

const TABLE: Record<string, string> = {
  manager: 'managers',
  expert:  'experts',
  client:  'clients',
  admin:   'admins',
};

export async function DELETE(request: NextRequest) {
  try {
    const { id, role } = await request.json();

    if (!id || !role || !TABLE[role]) {
      return NextResponse.json({ error: 'Missing id or role' }, { status: 400 });
    }

    // Get auth_id before deleting the row
    const { data: row } = await supabase
      .from(TABLE[role])
      .select('auth_id')
      .eq('id', id)
      .maybeSingle();

    // Delete from table first
    const { error: dbError } = await supabase.from(TABLE[role]).delete().eq('id', id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });

    // Delete from auth if we have auth_id (best-effort)
    if (row?.auth_id) {
      await deleteUserAuth(row.auth_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/users/delete]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
