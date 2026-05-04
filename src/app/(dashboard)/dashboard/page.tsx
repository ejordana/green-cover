
"use client";

import { mockClaims } from '@/lib/mock-data';
import { ClaimCard } from '@/components/claim-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const activeClaims = mockClaims.filter(c => c.status !== 'Tancat');

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Resum de Sinistres</h2>
          <Link href="/claims" className="text-primary text-sm font-bold flex items-center gap-1">
            Veure tots <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        
        {activeClaims.length > 0 ? (
          <div className="space-y-3">
            {activeClaims.map(claim => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </div>
        ) : (
          <Card className="bg-white/50 border-dashed border-2">
            <CardContent className="p-8 text-center text-muted-foreground">
              No tens sinistres actius actualment.
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <Link href="/claims/new">
          <Button size="lg" className="w-full h-24 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg shadow-primary/20">
            <PlusCircle className="h-8 w-8" />
            <span className="text-lg font-bold">Declarar Nou Sinistre</span>
          </Button>
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground">SLA Resolució</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-primary">72h</p>
            <p className="text-[10px] text-muted-foreground">Compromís Green Cover</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground">Pòlissa Activa</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-lg font-bold text-primary truncate">Real Club Golf</p>
            <p className="text-[10px] text-muted-foreground">Venciment: 12/2026</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
