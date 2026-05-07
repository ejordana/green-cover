"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getClaims } from '@/lib/db';
import type { Claim } from '@/lib/types';
import { ClaimCard } from '@/components/claim-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRight, Timer, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

function DashboardContent() {
  const searchParams = useSearchParams();
  const role = searchParams?.get('role');
  const queryString = searchParams?.toString();
  const buildHref = (href: string) => queryString ? `${href}?${queryString}` : href;
  const isClient = role === 'client';

  const title = role === 'gestor'
    ? 'Portal Gestor'
    : isClient
      ? 'Portal Client'
      : 'Portal GreenCover';

  const subtitle = role === 'gestor'
    ? 'Gestiona sinistres, contacta amb l\u2019equip i revisa l\u2019historial de casos.'
    : isClient
      ? 'Consulta el teu historial, declara sinistres i mant\u00e9n el contacte amb el teu gestor.'
      : 'Accedeix al tauler de GreenCover per gestionar sinistres i p\u00f2lisses.';

  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    getClaims().then(setClaims).catch(console.error);
  }, []);

  const activeClaims = claims.filter(c => c.status !== 'Tancat');

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-white border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-5">
        <div className="mb-2 text-sm font-semibold text-primary uppercase tracking-[0.24em]">Benvingut</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 p-1.5 rounded-lg">
                <Timer className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">SLA</span>
            </div>
            <p className="text-2xl font-bold text-primary leading-none mb-1">72h</p>
            <p className="text-[10px] text-muted-foreground">Comp\u0072om\u00eds Green Cover</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">P\u00f2lissa</span>
            </div>
            <p className="text-base font-bold text-primary leading-tight truncate">Real Club Golf</p>
            <p className="text-[10px] text-muted-foreground">Venciment: 12/2026</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Link href={buildHref('/claims/new')}>
          <Button
            size="lg"
            className="w-full h-14 rounded-xl flex items-center justify-center gap-3 shadow-md shadow-primary/15 font-semibold text-sm"
          >
            <div className="bg-white/20 p-1 rounded-lg">
              <PlusCircle className="h-5 w-5" />
            </div>
            Declarar Nou Sinistre
          </Button>
        </Link>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Sinistres Actius</h2>
          <Link href={buildHref('/claims')} className="text-primary text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity">
            Veure tots <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {activeClaims.length > 0 ? (
          <div className="space-y-2.5">
            {activeClaims.map(claim => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl bg-white border border-dashed border-border/60 shadow-none">
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              No tens sinistres actius actualment.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
