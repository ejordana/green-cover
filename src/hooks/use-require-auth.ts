"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getRoleByAuthId } from '@/lib/db';

export type UserRole = 'client' | 'manager' | 'expert' | 'admin';

export interface AuthUser {
  authId: string;
  role: UserRole;
  email: string;
}

function redirectByRole(router: ReturnType<typeof useRouter>, role: string) {
  switch (role) {
    case 'client':  router.replace('/dashboard'); break;
    case 'manager': router.replace('/gestor');    break;
    case 'expert':  router.replace('/perit');     break;
    case 'admin':   router.replace('/admin');     break;
    default:        router.replace('/login');
  }
}

export function useRequireAuth(requiredRole?: UserRole) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
        return;
      }

      let role = session.user.user_metadata?.role as UserRole | undefined;

      // Fallback: si no hi ha rol al metadata, consultem la BD
      if (!role) {
        const profile = await getRoleByAuthId(session.user.id, session.user.email);
        if (!profile) {
          router.replace('/login');
          return;
        }
        role = profile.role;
      }

      if (requiredRole && role !== requiredRole) {
        redirectByRole(router, role);
        return;
      }

      setAuth({ authId: session.user.id, role, email: session.user.email ?? '' });
      setLoading(false);
    });
  }, []);

  return { auth, loading };
}
