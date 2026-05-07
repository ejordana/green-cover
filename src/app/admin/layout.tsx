"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { getProfileByAuth } from '@/lib/db';
import { LayoutDashboard, Users, UserCheck, Building2, Shield } from 'lucide-react';

const NAV = [
  { label: 'Sinistres', href: '/admin' },
  { label: 'Clients', href: '/admin/clients' },
  { label: 'Gestors', href: '/admin/managers' },
  { label: 'Perits', href: '/admin/experts' },
  { label: 'Usuaris', href: '/admin/users' },
];

const MOBILE_NAV = [
  { label: 'Sinistres', href: '/admin', icon: LayoutDashboard },
  { label: 'Clients', href: '/admin/clients', icon: Building2 },
  { label: 'Gestors', href: '/admin/managers', icon: Users },
  { label: 'Perits', href: '/admin/experts', icon: UserCheck },
  { label: 'Usuaris', href: '/admin/users', icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { auth, loading } = useRequireAuth('admin');
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    if (!auth) return;
    getProfileByAuth(auth.authId, 'admin').then(profile => {
      if (profile) setAdminName(profile.name);
    }).catch(console.error);
  }, [auth]);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  const initials = adminName
    ? adminName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PortalHeader
        title="Portal Admin"
        navItems={NAV.map(item => ({ ...item, active: pathname === item.href }))}
        userName={adminName || auth?.email || ''}
        userInitials={initials}
        userSubtitle="Administrador"
      />

      <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border/60 flex justify-around px-2 pt-2 pb-3 z-50 md:hidden">
        {MOBILE_NAV.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 min-w-[40px]">
              <div className={cn("p-2 rounded-xl transition-all", isActive ? "bg-primary text-white" : "text-muted-foreground")}>
                <Icon className="h-4 w-4" />
              </div>
              <span className={cn("text-[9px] font-semibold", isActive ? "text-primary" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
