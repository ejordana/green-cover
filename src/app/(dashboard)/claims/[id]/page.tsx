"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getClaimById, getExpertById } from '@/lib/db';
import type { Claim, ClaimStatus, Expert } from '@/lib/types';
import { ChatPanel } from '@/components/chat-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, Euro, Clock, ImageIcon, Phone, Mail, Paperclip, Download, CheckCircle2, FileText, MapPin } from 'lucide-react';
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
  'Perit designat',
  'Informe rebut',
  'Aprovat',
  'Pagat',
  'Tancat',
];

const CLAIM_TYPE_LABEL: Record<string, string> = {
  'RC':                'Responsabilitat Civil',
  'meteorològic':      'Meteorològic',
  'maquinària':        'Maquinària',
  'accident personal': 'Accident Personal',
  'ciberincident':     'Ciberincident',
  'altres':            'Altres',
};

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
  const isClosed = claim.status === 'Tancat';
  const typeLabel = CLAIM_TYPE_LABEL[claim.type] ?? claim.type;

  return (
    <div className="space-y-5 pb-10">

      {/* Capçalera */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2 mt-0.5 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
            {claim.number} · {typeLabel}
          </p>
          <h1 className="text-xl font-bold text-foreground leading-snug">
            {claim.title || typeLabel}
          </h1>
        </div>
      </div>

      <Tabs defaultValue="detalls" className="w-full">
        <TabsList className="w-full shadow-sm">
          <TabsTrigger value="detalls" className="flex-1">Detalls</TabsTrigger>
          <TabsTrigger value="xat" className="flex-1">Gestor</TabsTrigger>
        </TabsList>

        {/* ── Pestanya Detalls ── */}
        <TabsContent value="detalls" className="space-y-4 mt-4">

          {/* Estat i progrés */}
          <Card className="shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-border/50 bg-white">
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Estat del sinistre</span>
                <span className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-md",
                  isClosed
                    ? "bg-slate-100 text-slate-600"
                    : "bg-primary/10 text-primary"
                )}>
                  {claim.status}
                </span>
              </div>

              {/* Stepper */}
              <div className="relative flex items-start justify-between pt-1">
                <div className="absolute top-[11px] left-3 right-3 h-px bg-slate-200" />
                <div
                  className="absolute top-[11px] left-3 h-px bg-primary transition-all duration-500"
                  style={{
                    width: currentStep === 0
                      ? '0%'
                      : `calc(${(currentStep / (STATUS_FLOW.length - 1)) * 100}% - 1.5rem + ${(currentStep / (STATUS_FLOW.length - 1)) * 1.5}rem)`,
                  }}
                />
                {STATUS_FLOW.map((s, i) => {
                  const done = i < currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={s} className="relative z-10 flex flex-col items-center gap-2" style={{ flex: 1 }}>
                      <div className={cn(
                        "w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center bg-white transition-all",
                        done    ? "border-primary bg-primary"
                        : active ? "border-primary"
                                 : "border-slate-300"
                      )}>
                        {done && <CheckCircle2 className="w-3 h-3 text-white fill-white stroke-none" />}
                        {active && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <span className={cn(
                        "text-[9px] font-semibold text-center leading-tight max-w-[44px]",
                        done || active ? "text-primary" : "text-slate-400"
                      )}>
                        {s}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Informació del sinistre */}
          <Card className="shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-border/50 bg-white">
            <CardContent className="p-5 divide-y divide-slate-100">
              <div className="flex items-center justify-between py-3 first:pt-0">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Data del sinistre
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {format(incidentDate, "d MMM yyyy 'a les' HH:mm", { locale: ca })}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Data declaració
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {format(claim.createdAt, 'd MMM yyyy', { locale: ca })}
                </span>
              </div>
              {claim.location && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Ubicació
                  </span>
                  <span className="text-xs font-mono text-foreground">
                    {claim.location.lat.toFixed(4)}°N {claim.location.lng.toFixed(4)}°E
                  </span>
                </div>
              )}
              {claim.estimatedCost != null && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Euro className="h-3.5 w-3.5" /> Estimació econòmica
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {claim.estimatedCost.toLocaleString('ca-ES')} €
                  </span>
                </div>
              )}
              {claim.description && (
                <div className="pt-3 last:pb-0 space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Descripció
                  </span>
                  <p className="text-sm text-foreground leading-relaxed">{claim.description}</p>
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
                      className="w-28 h-28 object-cover rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.12)] hover:opacity-90 transition-opacity"
                      onError={showPhotoPlaceholder}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Perit assignat */}
          {expert && (
            <Card className="shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-border/50 bg-white">
              <CardContent className="p-5 space-y-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Perit assignat
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                    {expert.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{expert.name}</p>
                    <p className="text-xs text-muted-foreground">{expert.specialty} · {expert.zone}</p>
                  </div>
                </div>
                <div className="flex gap-2 border-t border-slate-100 pt-4">
                  {expert.phone && (
                    <a href={`tel:${expert.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors">
                      <Phone className="h-3.5 w-3.5" /> Trucar
                    </a>
                  )}
                  {expert.email && (
                    <a href={`mailto:${expert.email}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors">
                      <Mail className="h-3.5 w-3.5" /> Escriure
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {claim.documents.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
                <Paperclip className="h-3 w-3" /> Documents ({claim.documents.length})
              </p>
              <Card className="shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-border/50 bg-white">
                <CardContent className="p-3 space-y-1">
                  {claim.documents.map((doc, idx) => (
                    <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                      <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium flex-1 truncate">{doc.name}</span>
                      <Download className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

        </TabsContent>

        {/* ── Pestanya Gestor ── */}
        <TabsContent value="xat" className="mt-4">
          <Card className="shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-border/50 overflow-hidden bg-white">
            <div className="h-[calc(100dvh-240px)] flex flex-col">
              <ChatPanel
                claimId={claim.id}
                senderRole="user"
                initialMessages={claim.messages}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
