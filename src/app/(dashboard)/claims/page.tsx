"use client";

import { useEffect, useState } from 'react';
import { getClaims } from '@/lib/db';
import type { Claim, ClaimType } from '@/lib/types';
import { ClaimCard } from '@/components/claim-card';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const TYPE_FILTERS: { value: ClaimType | 'Tots'; label: string }[] = [
  { value: 'Tots',             label: 'Tots' },
  { value: 'RC',               label: 'RC' },
  { value: 'meteorològic',     label: 'Meteor.' },
  { value: 'maquinària',       label: 'Maquinària' },
  { value: 'accident personal',label: 'Accident' },
  { value: 'ciberincident',    label: 'Ciber' },
  { value: 'altres',           label: 'Altres' },
];

type StatusFilter = 'Actius' | 'Tancats' | 'Tots';

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Actius');
  const [typeFilter, setTypeFilter] = useState<ClaimType | 'Tots'>('Tots');

  useEffect(() => {
    getClaims().then(setClaims).catch(console.error);
  }, []);

  const filtered = claims
    .filter(c => {
      if (statusFilter === 'Actius')  return c.status !== 'Tancat';
      if (statusFilter === 'Tancats') return c.status === 'Tancat';
      return true;
    })
    .filter(c => typeFilter === 'Tots' || c.type === typeFilter);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Els meus Sinistres</h2>

      {/* Filtre per estat */}
      <div className="flex gap-2">
        {(['Actius', 'Tancats', 'Tots'] as StatusFilter[]).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold transition-colors',
              statusFilter === s
                ? 'bg-primary text-white'
                : 'bg-white text-muted-foreground border hover:border-primary/50'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Filtre per tipus (RF-16) */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {TYPE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTypeFilter(value)}
            className={cn(
              'flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors',
              typeFilter === value
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-white border-transparent text-muted-foreground hover:border-muted'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Llista */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map(c => <ClaimCard key={c.id} claim={c} />)
        ) : (
          <Card className="border-dashed border-2 bg-white/50">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No hi ha sinistres que coincideixin amb els filtres.
            </CardContent>
          </Card>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        {filtered.length} sinistre{filtered.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
