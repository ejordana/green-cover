
"use client";

import { useEffect, useState } from 'react';
import { getClaims } from '@/lib/db';
import type { Claim } from '@/lib/types';
import { ClaimCard } from '@/components/claim-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRight, Timer, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    getClaims().then(setClaims).catch(console.error);
  }, []);

  const activeClaims = claims.filter(c => c.status !== 'Tancat');

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3">
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

      <section>
        <Link href="/claims/new">
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
          <Link href="/claims" className="text-primary text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity">
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
    </div>
  );
}
