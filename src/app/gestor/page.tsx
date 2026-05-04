"use client";

import { useEffect, useState, useMemo } from 'react';
import { getClaims, getGeneralMessages } from '@/lib/db';
import { Claim, ChatMessage } from '@/lib/types';
import { ClaimStatusBadge } from '@/components/claim-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, FileText, MessageSquare, CheckCircle2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function GestorHomePage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [generalMessages, setGeneralMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getClaims(),
      getGeneralMessages(),
    ]).then(([c, g]) => {
      setClaims(c);
      setGeneralMessages(g);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const now = useMemo(() => new Date(), []);
  const h48ago = useMemo(() => new Date(now.getTime() - 48 * 60 * 60 * 1000), [now]);
  const h24ago = useMemo(() => new Date(now.getTime() - 24 * 60 * 60 * 1000), [now]);

  const totalActius = useMemo(
    () => claims.filter(c => c.status !== 'Tancat' && c.status !== 'Pagat').length,
    [claims]
  );
  const pendents = useMemo(
    () => claims.filter(c => c.status === 'Declarat').length,
    [claims]
  );
  const slaRisc = useMemo(
    () => claims.filter(c => c.status === 'Declarat' && c.createdAt < h48ago).length,
    [claims, h48ago]
  );
  const missatgesNous = useMemo(() => {
    const claimMsgs = claims.flatMap(c => c.messages).filter(
      m => m.sender === 'user' && m.timestamp >= h24ago
    ).length;
    const generalMsgs = generalMessages.filter(
      m => m.sender === 'user' && m.timestamp >= h24ago
    ).length;
    return claimMsgs + generalMsgs;
  }, [claims, generalMessages, h24ago]);

  const sinistresTotalsRecents = useMemo(
    () => [...claims].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5),
    [claims]
  );

  const alertesSLA = useMemo(
    () => claims.filter(c => c.status === 'Declarat' && c.createdAt < h48ago),
    [claims, h48ago]
  );

  const kpis = [
    {
      label: 'Sinistres actius',
      value: totalActius,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Pendents de revisar',
      value: pendents,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'SLA en risc',
      value: slaRisc,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Missatges nous (24h)',
      value: missatgesNous,
      icon: MessageSquare,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-muted-foreground">Carregant dades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resum d'activitat</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", kpi.bg)}>
                    <Icon className={cn("h-4.5 w-4.5", kpi.color)} style={{ height: '1.125rem', width: '1.125rem' }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold leading-none text-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{kpi.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sinistres recents */}
        <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
          <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-bold">Sinistres recents</CardTitle>
            </div>
            <Link href="/gestor/sinistres" className="text-xs font-semibold text-primary hover:underline">
              Veure tots
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-2">
            {sinistresTotalsRecents.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">Sense sinistres registrats.</p>
            )}
            {sinistresTotalsRecents.map((claim) => (
              <Link
                key={claim.id}
                href={`/gestor/sinistres`}
                className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{claim.number}</p>
                    <p className="text-[10px] text-muted-foreground capitalize truncate">
                      {claim.title || claim.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ClaimStatusBadge status={claim.status} className="text-[10px] px-2 py-0" />
                  <span className="text-[10px] text-muted-foreground hidden sm:block">
                    {format(claim.createdAt, 'd MMM', { locale: ca })}
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Alertes SLA */}
        <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
          <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <CardTitle className="text-sm font-bold">Alertes SLA</CardTitle>
            {alertesSLA.length > 0 && (
              <span className="ml-auto bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {alertesSLA.length} pendents
              </span>
            )}
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-2">
            {alertesSLA.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" style={{ height: '1.125rem', width: '1.125rem' }} />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Cap sinistre supera les 48h en estat Declarat.</p>
              </div>
            ) : (
              alertesSLA.map((claim) => {
                const hoursElapsed = Math.floor(
                  (now.getTime() - claim.createdAt.getTime()) / (1000 * 60 * 60)
                );
                return (
                  <Link
                    key={claim.id}
                    href="/gestor/sinistres"
                    className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100/60 transition-colors"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-red-900">{claim.number}</p>
                      <p className="text-[10px] text-red-700 capitalize truncate">{claim.title || claim.type}</p>
                      <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {hoursElapsed}h en estat &quot;Declarat&quot;
                      </p>
                    </div>
                    <ClaimStatusBadge status={claim.status} className="text-[10px] px-2 py-0 flex-shrink-0" />
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
