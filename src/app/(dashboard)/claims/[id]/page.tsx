"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getClaimById, getManager } from '@/lib/db';
import type { Claim, ClaimStatus, Manager } from '@/lib/types';
import { ChatPanel } from '@/components/chat-panel';
import { ClaimStatusBadge } from '@/components/claim-status-badge';
import { ManagerContactCard } from '@/components/manager-contact-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, Euro, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const STATUS_FLOW: ClaimStatus[] = [
  'Declarat',
  'Gestor assignat',
  'Perit designat',
  'Informe rebut',
  'Aprovat',
  'Pagat',
  'Tancat',
];

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [manager, setManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getClaimById(id),
      getManager(),
    ])
      .then(([c, m]) => { setClaim(c); setManager(m); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Carregant...
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <p className="text-muted-foreground text-sm">Sinistre no trobat.</p>
        <Button variant="ghost" onClick={() => router.back()}>Tornar</Button>
      </div>
    );
  }

  const currentStep = STATUS_FLOW.indexOf(claim.status);
  const incidentDate = claim.incidentAt ?? claim.createdAt;

  return (
    <div className="space-y-4 pb-8">
      {/* Capçalera */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {claim.number}
          </p>
          <h2 className="font-bold truncate text-sm">{claim.description}</h2>
        </div>
        <ClaimStatusBadge status={claim.status} />
      </div>

      {/* Timeline d'estats (RF-13) */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-4 pb-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Estat del sinistre
          </p>
          <div className="flex items-start">
            {STATUS_FLOW.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={cn(
                    'h-3 w-3 rounded-full border-2 transition-colors',
                    i < currentStep  && 'bg-primary border-primary',
                    i === currentStep && 'bg-primary border-primary ring-2 ring-primary/20 ring-offset-1',
                    i > currentStep  && 'bg-white border-slate-300',
                  )} />
                  <span className={cn(
                    'text-[8px] font-semibold text-center leading-tight',
                    'w-10 break-words',
                    i <= currentStep ? 'text-primary' : 'text-slate-300'
                  )}>
                    {s}
                  </span>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div className={cn(
                    'h-0.5 flex-1 mb-4',
                    i < currentStep ? 'bg-primary' : 'bg-slate-200'
                  )} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info bàsica (RF-12) */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tipus de sinistre</span>
            <span className="text-xs font-bold capitalize">{claim.type}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Data del sinistre
            </span>
            <span className="text-xs font-bold">
              {format(incidentDate, "d MMM yyyy 'a les' HH:mm", { locale: ca })}
            </span>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Data declaració
            </span>
            <span className="text-xs font-bold">
              {format(claim.createdAt, 'd MMM yyyy', { locale: ca })}
            </span>
          </div>
          {claim.estimatedCost != null && (
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Euro className="h-3 w-3" /> Estimació econòmica
              </span>
              <span className="text-sm font-bold text-primary">
                {claim.estimatedCost.toLocaleString('ca-ES')} €
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gestor assignat (RF-12) */}
      {manager && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
            Gestor assignat
          </p>
          <ManagerContactCard manager={manager} />
        </div>
      )}

      {/* Xat (RF-21) */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
          Comunicació amb el gestor
        </p>
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="h-[320px] flex flex-col">
            <ChatPanel
              claimId={claim.id}
              senderRole="user"
              initialMessages={claim.messages}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
