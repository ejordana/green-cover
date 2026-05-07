"use client";

import { useState, useMemo, useEffect } from 'react';
import { getClaims } from '@/lib/db';
import { ClaimStatusBadge } from '@/components/claim-status-badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, FileText, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Claim, ClaimStatus } from '@/lib/types';
import Link from 'next/link';

const ALL_STATUSES: ClaimStatus[] = [
  'Declarat', 'En validació', 'Documentació pendent', 'En avaluació',
  'En peritació', 'Informe rebut', 'Aprovat', 'Pagat', 'Tancat', 'Denegat',
];

export default function GestorSinistresPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ClaimStatus | 'Tots'>('Tots');
  const { toast } = useToast();

  useEffect(() => {
    getClaims().then(setClaims).catch(() =>
      toast({ title: 'Error carregant sinistres', variant: 'destructive' })
    );
  }, []);

  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      const matchSearch =
        search.trim() === '' ||
        c.number.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.type.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'Tots' || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [claims, search, filterStatus]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Sinistres</h2>
        <span className="text-xs text-muted-foreground">{filteredClaims.length} sinistres</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cercar per número, títol o tipus..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white rounded-xl h-10 border-0 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          />
        </div>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as ClaimStatus | 'Tots')}>
          <SelectTrigger className="h-10 text-xs w-full sm:w-44 flex-shrink-0 bg-white rounded-xl border-0 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <SelectValue placeholder="Estat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Tots" className="text-xs">Tots els estats</SelectItem>
            {ALL_STATUSES.map(s => (
              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredClaims.map(claim => (
          <Link key={claim.id} href={`/gestor/sinistres/${claim.id}`} className="block group">
            <Card className="overflow-hidden rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all active:scale-[0.99]">
              <CardContent className="p-0">
                <div className="flex">
                  <div className="w-1 bg-primary flex-shrink-0 rounded-l-2xl" />
                  <div className="p-4 flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{claim.number}</p>
                        <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">{claim.title || claim.type}</h3>
                      </div>
                      <ClaimStatusBadge status={claim.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">{format(claim.createdAt, 'dd MMM yyyy', { locale: ca })}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-primary font-semibold text-xs">
                        Gestionar <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filteredClaims.length === 0 && (
          <Card className="rounded-2xl border-dashed border-2 bg-white/50 shadow-none">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Cap sinistre trobat.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
