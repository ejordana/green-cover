
"use client";

import { useEffect, useState } from 'react';
import { ManagerContactCard } from '@/components/manager-contact-card';
import { getManager } from '@/lib/db';
import type { Manager } from '@/lib/types';
import { LayoutDashboard, FileText, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [manager, setManager] = useState<Manager | null>(null);

  useEffect(() => {
    getManager().then(setManager).catch(console.error);
  }, []);

  const navItems = [
    { label: 'Inici', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Sinistres', href: '/claims', icon: FileText },
    { label: 'Pòlissa', href: '/policy', icon: Shield },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background pb-24 shadow-xl shadow-black/5">
      <header className="px-4 pt-4 pb-3 bg-white sticky top-0 z-50 border-b border-border/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <Shield className="h-4 w-4 text-emerald-300" />
            </div>
            <span className="text-base font-bold text-primary tracking-tight">GreenCover</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-medium">En línia</span>
          </div>
        </div>
        {manager && <ManagerContactCard manager={manager} />}
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-border/60 flex justify-around px-2 pt-2 pb-3 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 min-w-[56px]"
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-200",
                isActive ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "text-[10px] font-semibold transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
