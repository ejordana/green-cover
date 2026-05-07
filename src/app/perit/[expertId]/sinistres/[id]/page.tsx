"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getExpertById } from '@/lib/db';
import type { Expert } from '@/lib/types';
import { ClaimDetailView } from '@/components/claim-detail-view';
import { PortalHeader } from '@/components/portal-header';

export default function PeritClaimDetailPage() {
  const { expertId, id } = useParams<{ expertId: string; id: string }>();
  const [expert, setExpert] = useState<Expert | null>(null);

  useEffect(() => {
    getExpertById(expertId).then(setExpert).catch(console.error);
  }, [expertId]);

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
        <ClaimDetailView claimId={id} role="perit" backHref={`/perit/${expertId}`} />
      </main>
    </div>
  );
}
