"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getExpertById, getClaimsByExpert } from '@/lib/db';
import type { Expert, Claim } from '@/lib/types';
import { ClaimStatusBadge } from '@/components/claim-status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, FileText, ChevronRight } from 'lucide-react';
import { PortalHeader } from '@/components/portal-header';
import Link from 'next/link';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';

export default function PeritDashboard() {
  const { expertId } = useParams<{ expertId: string }>();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getExpertById(expertId), getClaimsByExpert(expertId)])
      .then(([e, c]) => { setExpert(e); setClaims(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [expertId]);

  const pendingClaims = claims.filter(c => c.status === 'En peritació');
  const doneClaims = claims.filter(c => c.status !== 'En peritació');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PortalHeader
        title="Portal Perit"
        logoHref={`/perit/${expertId}`}
        userName={expert?.name ?? ''}
        userInitials={expert ? expert.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '??'}
        userSubtitle={expert?.specialty}
      />

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <p className="text-sm text-muted-foreground">Carregant...</p>
          </div>
        ) : (
          <>
            {pendingClaims.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-orange-500" /> Pendent d&apos;informe ({pendingClaims.length})
                </p>
                <div className="space-y-3">
                  {pendingClaims.map(claim => (
                    <ClaimCard key={claim.id} claim={claim} expertId={expertId} />
                  ))}
                </div>
              </div>
            )}

            {doneClaims.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Informats ({doneClaims.length})
                </p>
                <div className="space-y-3">
                  {doneClaims.map(claim => (
                    <ClaimCard key={claim.id} claim={claim} expertId={expertId} />
                  ))}
                </div>
              </div>
            )}

            {claims.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground text-center">
                <FileText className="h-10 w-10 opacity-20 mb-3" />
                <p className="text-sm font-medium">No tens sinistres assignats.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ClaimCard({ claim, expertId }: { claim: Claim; expertId: string }) {
  return (
    <Link href={`/perit/${expertId}/sinistres/${claim.id}`} className="block group">
      <Card className="overflow-hidden rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all active:scale-[0.99]">
        <CardContent className="p-0">
          <div className="flex">
            <div className={claim.status === 'En peritació' ? "w-1 bg-orange-400 flex-shrink-0 rounded-l-2xl" : "w-1 bg-primary flex-shrink-0 rounded-l-2xl"} />
            <div className="p-4 flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{claim.number}</p>
                  <p className="font-semibold text-sm text-foreground truncate mt-0.5">{claim.title ?? claim.description}</p>
                </div>
                <ClaimStatusBadge status={claim.status} className="text-[10px] px-2 py-0 flex-shrink-0" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground capitalize">{claim.type} · {format(claim.createdAt, 'd MMM yyyy', { locale: ca })}</span>
                <span className="text-xs font-semibold text-primary flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                  {claim.status === 'En peritació' ? 'Redactar informe' : 'Veure detall'}
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
