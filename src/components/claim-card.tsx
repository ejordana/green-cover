
"use client";

import { Claim } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { ClaimStatusBadge } from './claim-status-badge';
import { Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';

export function ClaimCard({ claim }: { claim: Claim }) {
  return (
    <Link href={`/claims/${claim.id}`}>
      <Card className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all active:scale-[0.98] bg-white">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{claim.number}</p>
              <h3 className="font-bold text-foreground text-sm line-clamp-1">{claim.description}</h3>
            </div>
            <ClaimStatusBadge status={claim.status} />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">{format(claim.createdAt, 'dd MMM yyyy', { locale: ca })}</span>
            </div>
            
            <div className="flex items-center gap-1 text-primary font-bold text-xs">
              Veure detall <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
