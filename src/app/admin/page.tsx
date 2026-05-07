"use client";

import { useState, useMemo, useEffect } from 'react';
import { getClaims } from '@/lib/db';
import { ClaimStatusBadge } from '@/components/claim-status-badge';
import { PortalHeader } from '@/components/portal-header';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { Claim } from '@/lib/types';
import Link from 'next/link';

export default function AdminBackOffice() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getClaims().then(setClaims).catch(console.error);
  }, []);

  const filteredClaims = useMemo(() => {
    if (!search.trim()) return claims;
    const q = search.toLowerCase();
    return claims.filter(c =>
      c.number.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q)
    );
  }, [claims, search]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PortalHeader
        title="Back-office"
        navItems={[
          { label: 'Sinistres', href: '/admin', active: true },
          { label: 'Clients', href: '/admin/clients', active: false },
          { label: 'Gestors', href: '/admin/managers', active: false },
          { label: 'Perits', href: '/admin/experts', active: false },
          { label: 'Usuaris', href: '/admin/users', active: false },
        ]}
        userName="Roger Jordana"
        userInitials="RJ"
        userSubtitle="Administrador"
      />

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Sinistres</h2>
            <span className="text-xs text-muted-foreground">{filteredClaims.length} sinistres</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cercar per número, títol o tipus..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-white rounded-xl h-10 border-0 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            />
          </div>

          <div className="space-y-3">
            {filteredClaims.map(claim => (
              <Link key={claim.id} href={`/admin/sinistres/${claim.id}`} className="block group">
                <Card className="overflow-hidden rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all active:scale-[0.99]">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-1 bg-primary flex-shrink-0 rounded-l-2xl" />
                      <div className="p-4 flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{claim.number}</p>
                            <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">{claim.title || claim.type}</h3>
                          </div>
                          <ClaimStatusBadge status={claim.status} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span className="text-xs">{format(claim.createdAt, 'dd MMM yyyy', { locale: ca })}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-primary font-semibold text-xs">
                            Gestionar <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {filteredClaims.length === 0 && (
              <Card className="rounded-2xl border-dashed border-2 bg-white/50 shadow-none">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  Cap sinistre trobat.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
