'use server';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _admin: SupabaseClient | null = null;

function getAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    _admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _admin
}

export async function createUserWithAuth(
  email: string,
  password: string,
  userRole: 'manager' | 'expert' | 'client' | 'admin',
  userData: Record<string, any>
) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await getAdmin().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: userRole,
        ...userData,
      },
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return { error: authError.message, statusCode: 400 };
    }

    if (!authData.user) {
      return { error: 'Failed to create user', statusCode: 400 };
    }

    return {
      success: true,
      authId: authData.user.id,
      email: authData.user.email,
    };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'Server error creating user', statusCode: 500 };
  }
}

export async function deleteUserAuth(authId: string) {
  try {
    const { error } = await getAdmin().auth.admin.deleteUser(authId);

    if (error) {
      console.error('Auth deletion error:', error);
      return { error: error.message, statusCode: 400 };
    }

    return { success: true };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'Server error deleting user', statusCode: 500 };
  }
}
