"use client";

import { useEffect, useState } from 'react';
import { getManager } from '@/lib/db';
import type { Manager } from '@/lib/types';
import { LayoutDashboard, FileText, Shield as ShieldIcon, Phone, MessageSquare, Headphones } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PortalHeader } from '@/components/portal-header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryString = searchParams?.toString();
  const addQueryToHref = (href: string) => queryString ? `${href}?${queryString}` : href;
  const [manager, setManager] = useState<Manager | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    getManager().then(setManager).catch(console.error);
  }, []);

  const navItems = [
    { label: 'Inici', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Sinistres', href: '/claims', icon: FileText },
    { label: 'Pòlissa', href: '/policy', icon: ShieldIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col mx-auto bg-slate-50 pb-24 shadow-xl shadow-black/5 max-w-7xl">
      <PortalHeader
        title="Portal Client"
        navItems={[
          { label: 'Inici', href: addQueryToHref('/dashboard'), active: pathname === '/dashboard' },
          { label: 'Sinistres', href: addQueryToHref('/claims'), active: pathname.startsWith('/claims') },
          { label: 'Pòlissa', href: addQueryToHref('/policy'), active: pathname === '/policy' },
        ]}
        userName="Real Club Golf"
        userInitials="RC"
        userSubtitle={manager ? `Gestor: ${manager.name}` : undefined}
      />

      <main className="flex-1 p-4 overflow-y-auto bg-slate-50">
        {children}
      </main>

      {manager && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className={cn(
              'fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-colors',
            )}>
              <Headphones className="h-5 w-5" />
              {manager.available && (
                <span className="absolute top-0.5 right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-white" />
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-left text-sm font-semibold text-muted-foreground">El teu gestor</SheetTitle>
            </SheetHeader>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <Avatar className="h-16 w-16 border border-border">
                  <AvatarImage src={manager.photoUrl} alt={manager.name} />
                  <AvatarFallback className="text-lg font-bold">{manager.name[0]}</AvatarFallback>
                </Avatar>
                {manager.available && (
                  <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{manager.name}</p>
                <p className="text-sm text-muted-foreground">
                  {manager.available ? 'Disponible ara' : 'No disponible'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => window.location.href = `tel:${manager.phone}`}
              >
                <Phone className="h-4 w-4" /> Trucar
              </Button>
              <Button className="flex-1 gap-2" onClick={() => { setSheetOpen(false); router.push(addQueryToHref('/xat')); }}>
                <MessageSquare className="h-4 w-4" /> Escriure
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      <nav className="fixed bottom-0 w-full max-w-7xl bg-white border-t border-border/60 flex justify-around px-2 pt-2 pb-3 z-50 mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={addQueryToHref(item.href)}
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
