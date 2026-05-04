"use client";

import { LayoutDashboard, FileText, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';

const NAV = [
  { label: 'Inici', href: '/gestor' },
  { label: 'Sinistres', href: '/gestor/sinistres' },
  { label: 'Missatges', href: '/gestor/missatges' },
];

const MOBILE_NAV = [
  { label: 'Inici', href: '/gestor', icon: LayoutDashboard },
  { label: 'Sinistres', href: '/gestor/sinistres', icon: FileText },
  { label: 'Missatges', href: '/gestor/missatges', icon: MessageSquare },
];

export default function GestorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PortalHeader
        title="Portal Gestor"
        navItems={NAV.map(item => ({ ...item, active: pathname === item.href }))}
        userName="Roger Jordana"
        userInitials="RJ"
        userSubtitle="Gestor de sinistres"
      />

      <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border/60 flex justify-around px-2 pt-2 pb-3 z-50 md:hidden">
        {MOBILE_NAV.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 min-w-[56px]">
              <div className={cn("p-2 rounded-xl transition-all", isActive ? "bg-primary text-white" : "text-muted-foreground")}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn("text-[10px] font-semibold", isActive ? "text-primary" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
