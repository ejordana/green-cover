
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getClaims } from '@/lib/db';
import type { Claim } from '@/lib/types';
import { ClaimCard } from '@/components/claim-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRight, Timer, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const role = searchParams?.get('role');
  const channel = searchParams?.get('channel');
  const queryString = searchParams?.toString();
  const buildHref = (href: string) => queryString ? `${href}?${queryString}` : href;
  const prefersMobile = useIsMobile();
  const isClient = role === 'client';
  const isDesktopChannel = channel === 'desktop';
  const isMobileChannel = channel === 'mobile';

  const title = role === 'gestor'
    ? 'Portal Gestor'
    : isClient
      ? 'Portal Client'
      : 'Portal GreenCover';

  const subtitle = role === 'gestor'
    ? 'Gestiona sinistres, contacta amb l’equip i revisa l’historial de casos.'
    : isClient
      ? 'Consulta el teu historial, declara sinistres i mantén el contacte amb el teu gestor.'
      : 'Accedeix al tauler de GreenCover per gestionar sinistres i pòlisses.';

  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    getClaims().then(setClaims).catch(console.error);
  }, []);

  const activeClaims = claims.filter(c => c.status !== 'Tancat');

  if (isClient && !channel) {
    return (
      <div className="space-y-5">
        <section className="rounded-3xl bg-white/90 border border-border/70 p-6 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-primary uppercase tracking-[0.24em]">Portal Client</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Tria el teu canal</h1>
          <p className="text-sm leading-6 text-slate-600 max-w-2xl">
            Hi ha dos canals disponibles per al client: un dissenyat per a escriptori i un altre per a mòbil.
            Tria el que millor s’adapti a la teva pantalla o l’experiència que vols provar.
          </p>
          {prefersMobile && (
            <p className="mt-3 text-sm text-emerald-600">Detectem que estàs en un dispositiu mòbil. El canal mòbil et funcionarà millor.</p>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Card className="border border-border/70 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-lg font-semibold">Canal Desktop</CardTitle>
                <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-1 text-[11px] font-semibold">Escriptori</span>
              </div>
              <p className="text-sm text-slate-600 mb-6">Dissenyat per a pantalles grans amb accés ràpid a l’estat de sinistres i la teva pòlissa.</p>
              <Link href="/dashboard?role=client&channel=desktop">
                <Button className="w-full">Entrar al canal Desktop</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-lg font-semibold">Canal Mòbil</CardTitle>
                <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-1 text-[11px] font-semibold">Mòbil</span>
              </div>
              <p className="text-sm text-slate-600 mb-6">Optimitzat per a navegació tàctil i accés ràpid des del teu telèfon.</p>
              <Link href="/dashboard?role=client&channel=mobile">
                <Button variant="outline" className="w-full">Entrar al canal Mòbil</Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  const channelLabel = isDesktopChannel ? 'Canal Desktop' : isMobileChannel ? 'Canal Mòbil' : null;
  const channelNote = isDesktopChannel
    ? 'Optimitzat per a la navegació amb teclat i pantalla gran.'
    : isMobileChannel
      ? 'Optimitzat per a l’experiència tàctil i la lectura ràpida.'
      : null;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-white/90 border border-border/70 p-5 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-primary uppercase tracking-[0.24em]">Benvingut</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {channelLabel && <p className="text-sm text-slate-500 mt-1 font-medium">{channelLabel}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">{subtitle}</p>
            {channelNote && <p className="text-xs text-slate-500 mt-1">{channelNote}</p>}
          </div>
        </div>
      </section>

      <section className={isMobileChannel ? 'space-y-4' : 'grid grid-cols-2 gap-3'}>
        <Card className="bg-white border border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 p-1.5 rounded-lg">
                <Timer className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">SLA</span>
            </div>
            <p className="text-2xl font-bold text-primary leading-none mb-1">72h</p>
            <p className="text-[10px] text-muted-foreground">Compromís Green Cover</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Pòlissa</span>
            </div>
            <p className="text-base font-bold text-primary leading-tight truncate">Real Club Golf</p>
            <p className="text-[10px] text-muted-foreground">Venciment: 12/2026</p>
          </CardContent>
        </Card>
      </section>

      {isMobileChannel ? (
        <section className="space-y-3">
          <Link href={buildHref('/claims/new')}>
            <Button className="w-full h-14 rounded-xl flex items-center justify-center gap-3 shadow-md shadow-primary/15 font-semibold text-sm">
              <div className="bg-white/20 p-1 rounded-lg">
                <PlusCircle className="h-5 w-5" />
              </div>
              Declarar Nou Sinistre
            </Button>
          </Link>

          <Card className="bg-white border border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Sinistres Actius</h2>
                <Link href={buildHref('/claims')} className="text-primary text-xs font-semibold hover:opacity-80 transition-opacity">
                  Veure tots
                </Link>
              </div>
              <div className="space-y-3">
                {activeClaims.length > 0 ? (
                  activeClaims.map(claim => (
                    <ClaimCard key={claim.id} claim={claim} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No tens sinistres actius actualment.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : (
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
      )}

      {!isMobileChannel && (
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
            <Card className="bg-white border border-dashed border-border shadow-none">
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                No tens sinistres actius actualment.
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
