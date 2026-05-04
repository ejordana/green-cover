
"use client";

import { ManagerContactCard } from '@/components/manager-contact-card';
import { mockManager } from '@/lib/mock-data';
import { LayoutDashboard, FileText, Shield, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Inici', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Sinistres', href: '/claims', icon: FileText },
    { label: 'Pòlissa', href: '/policy', icon: Shield },
    { label: 'Perfil', href: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background pb-24 shadow-2xl">
      <header className="p-4 bg-white sticky top-0 z-50 border-b">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-primary">GreenCover</h1>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
        <ManagerContactCard manager={mockManager} />
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t flex justify-around p-3 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
