"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getClaimById, getExpertById } from '@/lib/db';
import type { Claim, ClaimStatus, Expert } from '@/lib/types';
import { ChatPanel } from '@/components/chat-panel';
import { ClaimStatusBadge } from '@/components/claim-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, Euro, Clock, ImageIcon, Phone, Mail, Paperclip, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const PHOTO_PLACEHOLDER = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f1f5f9' rx='4'/%3E%3Cpath d='M35 65 L35 45 L40 38 L60 38 L65 45 L65 65 Z' stroke='%2394a3b8' fill='none' stroke-width='2' stroke-linejoin='round'/%3E%3Ccircle cx='50' cy='54' r='8' stroke='%2394a3b8' fill='none' stroke-width='2'/%3E%3C/svg%3E";

function showPhotoPlaceholder(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = PHOTO_PLACEHOLDER;
}

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
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClaimById(id)
      .then(async (c) => {
        setClaim(c);
        if (c?.assignedExpertId) {
          const e = await getExpertById(c.assignedExpertId);
          setExpert(e);
        }
      })
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
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {claim.number}
          </p>
          <h2 className="font-semibold truncate text-sm">{claim.description}</h2>
        </div>
        <ClaimStatusBadge status={claim.status} />
      </div>

      {/* Timeline d'estats */}
      <Card className="border border-border/60 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-4 pb-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
                    i > currentStep  && 'bg-white border-muted',
                  )} />
                  <span className={cn(
                    'text-[8px] font-semibold text-center leading-tight w-10 break-words',
                    i <= currentStep ? 'text-primary' : 'text-muted-foreground/40'
                  )}>
                    {s}
                  </span>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div className={cn(
                    'h-0.5 flex-1 mb-4',
                    i < currentStep ? 'bg-primary' : 'bg-muted'
                  )} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info bàsica */}
      <Card className="border border-border/60 shadow-sm bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tipus de sinistre</span>
            <span className="text-xs font-semibold capitalize">{claim.type}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Data del sinistre
            </span>
            <span className="text-xs font-semibold">
              {format(incidentDate, "d MMM yyyy 'a les' HH:mm", { locale: ca })}
            </span>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Data declaració
            </span>
            <span className="text-xs font-semibold">
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

      {/* Fotos */}
      {claim.photos.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
            <ImageIcon className="h-3 w-3" /> Fotografies ({claim.photos.length})
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {claim.photos.map((url, idx) => (
              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <img
                  src={url}
                  alt={`Foto ${idx + 1}`}
                  className="w-28 h-28 object-cover rounded-xl border border-border/60 shadow-sm hover:opacity-90 transition-opacity"
                  onError={showPhotoPlaceholder}
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Perit assignat */}
      {expert && (
        <Card className="border border-emerald-200 bg-emerald-50/50 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
              Perit assignat
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                {expert.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">{expert.name}</p>
                <p className="text-xs text-emerald-600">{expert.specialty} · {expert.zone}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-emerald-200 pt-3">
              {expert.phone && (
                <a href={`tel:${expert.phone}`} className="flex items-center gap-2 text-xs text-emerald-700 hover:text-emerald-900">
                  <Phone className="h-3.5 w-3.5" /> {expert.phone}
                </a>
              )}
              {expert.email && (
                <a href={`mailto:${expert.email}`} className="flex items-center gap-2 text-xs text-emerald-700 hover:text-emerald-900">
                  <Mail className="h-3.5 w-3.5" /> {expert.email}
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents del perit */}
      {claim.documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
            <Paperclip className="h-3 w-3" /> Documents ({claim.documents.length})
          </p>
          <Card className="border border-border/60 shadow-sm bg-white">
            <CardContent className="p-3 space-y-1.5">
              {claim.documents.map((doc, idx) => (
                <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/60 hover:bg-muted/20 transition-colors group">
                  <Paperclip className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-xs font-medium flex-1 truncate">{doc.name}</span>
                  <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Xat */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Comunicació amb el gestor
        </p>
        <Card className="border border-border/60 shadow-sm overflow-hidden bg-white">
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
