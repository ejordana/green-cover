
"use client";

import { Claim } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { ClaimStatusBadge } from './claim-status-badge';
import { Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';

export function ClaimCard({ claim }: { claim: Claim }) {
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString();
  const claimHref = queryString ? `/claims/${claim.id}?${queryString}` : `/claims/${claim.id}`;

  return (
    <Link href={claimHref}>
      <Card className="group overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all active:scale-[0.99] bg-white">
        <CardContent className="p-0">
          <div className="flex">
            <div className="w-1 bg-primary flex-shrink-0 rounded-l-xl" />
            <div className="p-4 flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{claim.number}</p>
                  <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">{claim.description}</h3>
                </div>
                <ClaimStatusBadge status={claim.status} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs">{format(claim.createdAt, 'dd MMM yyyy', { locale: ca })}</span>
                </div>
                <div className="flex items-center gap-0.5 text-primary font-semibold text-xs">
                  Veure <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
