"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { getProfileByAuth } from '@/lib/db';

export default function PeritLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { auth, loading } = useRequireAuth('expert');

  useEffect(() => {
    if (!auth) return;
    // Si l'expert aterra a /perit (selector) sense expertId, el redirigim al seu portal
    if (pathname === '/perit') {
      getProfileByAuth(auth.authId, 'expert').then(profile => {
        if (profile) router.replace(`/perit/${profile.id}`);
      }).catch(console.error);
    }
  }, [auth, pathname]);

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-[#1a3d2b] via-[#1f4d35] to-[#2d6a46] flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return <>{children}</>;
}
