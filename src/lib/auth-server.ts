'use server';

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function createUserWithAuth(
  email: string,
  password: string,
  userRole: 'manager' | 'expert' | 'client' | 'admin',
  userData: Record<string, any>
) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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
    const { error } = await supabaseAdmin.auth.admin.deleteUser(authId);

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
