"use client";

import type { ClaimEvent, ClaimStatus } from '@/lib/types';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, FileText, UserCheck, AlertCircle,
  Clock, XCircle, Banknote, Archive, ClipboardList,
} from 'lucide-react';

const STATUS_CONFIG: Record<ClaimStatus, { color: string; bg: string; icon: React.ElementType }> = {
  'Declarat':              { color: 'text-slate-600',   bg: 'bg-slate-100',   icon: FileText },
  'En validació':          { color: 'text-blue-600',    bg: 'bg-blue-100',    icon: Clock },
  'Documentació pendent':  { color: 'text-amber-600',   bg: 'bg-amber-100',   icon: AlertCircle },
  'En avaluació':          { color: 'text-violet-600',  bg: 'bg-violet-100',  icon: ClipboardList },
  'En peritació':          { color: 'text-indigo-600',  bg: 'bg-indigo-100',  icon: UserCheck },
  'Informe rebut':         { color: 'text-cyan-600',    bg: 'bg-cyan-100',    icon: FileText },
  'Aprovat':               { color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle2 },
  'Pagat':                 { color: 'text-green-600',   bg: 'bg-green-100',   icon: Banknote },
  'Tancat':                { color: 'text-slate-500',   bg: 'bg-slate-100',   icon: Archive },
  'Denegat':               { color: 'text-red-600',     bg: 'bg-red-100',     icon: XCircle },
};

const ACTOR_LABEL: Record<string, string> = {
  gestor:  'Gestor',
  admin:   'Admin',
  perit:   'Perit',
  sistema: 'Sistema',
};

interface ClaimTimelineProps {
  events: ClaimEvent[];
  loading?: boolean;
}

export function ClaimTimeline({ events, loading }: ClaimTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-3 px-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3 bg-muted rounded w-1/3" />
              <div className="h-2.5 bg-muted rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Sense historial d&apos;estats enregistrat.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Línia vertical */}
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-slate-200" />

      <div className="space-y-0">
        {events.map((event, idx) => {
          const cfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG['Declarat'];
          const Icon = cfg.icon;
          const isLast = idx === events.length - 1;

          return (
            <div key={event.id} className={cn('flex gap-3', !isLast && 'pb-5')}>
              {/* Dot */}
              <div className={cn('relative z-10 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center', cfg.bg)}>
                <Icon className={cn('h-3.5 w-3.5', cfg.color)} />
              </div>

              {/* Contingut */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <span className={cn('text-sm font-semibold', cfg.color)}>{event.status}</span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {format(event.createdAt, "d MMM yyyy, HH:mm", { locale: ca })}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {event.actorName
                      ? `${ACTOR_LABEL[event.actorRole] ?? event.actorRole}: ${event.actorName}`
                      : ACTOR_LABEL[event.actorRole] ?? event.actorRole}
                  </span>
                </div>

                {event.note && (
                  <p className="mt-1.5 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 leading-relaxed">
                    {event.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
