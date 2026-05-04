"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  label: string;
  href: string;
  active: boolean;
}

interface PortalHeaderProps {
  title: string;
  subtitle?: string;
  navItems?: NavItem[];
  userName: string;
  userInitials: string;
  userSubtitle?: string;
  logoHref?: string;
}

export function PortalHeader({
  title,
  subtitle,
  navItems,
  userName,
  userInitials,
  userSubtitle,
  logoHref = '/',
}: PortalHeaderProps) {
  const router = useRouter();

  return (
    <header className="bg-primary text-white sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between gap-6 w-full px-6 py-3">

        {/* Esquerra: logo + nav */}
        <div className="flex items-center gap-5 min-w-0">
          <Link href={logoHref} className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity">
            <div className="bg-white/10 border border-white/20 p-1.5 rounded-lg">
              <Shield className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight">GreenCover</p>
              <p className="text-[10px] text-white/60 leading-tight">{title}</p>
            </div>
          </Link>

          {navItems && navItems.length > 0 && (
            <nav className="flex gap-0.5 bg-white/10 p-1 rounded-lg overflow-x-auto">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <button className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors",
                    item.active
                      ? "bg-white text-primary"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}>
                    {item.label}
                  </button>
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Dreta: avatar amb dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10 transition-colors shrink-0 focus:outline-none">
              <div className="h-8 w-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-xs font-bold text-white">
                {userInitials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold leading-tight">{userName}</p>
                {userSubtitle && <p className="text-[10px] text-white/60 leading-tight">{userSubtitle}</p>}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-semibold">{userName}</p>
              {userSubtitle && <p className="text-xs text-muted-foreground">{userSubtitle}</p>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/')} className="gap-2 text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="h-4 w-4" />
              Tancar sessió
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {subtitle && (
        <div className="border-t border-white/10 px-6 py-1.5 w-full">
          <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">{subtitle}</p>
        </div>
      )}
    </header>
  );
}
