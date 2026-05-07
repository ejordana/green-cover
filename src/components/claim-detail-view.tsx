"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getClaimById, getExpertById, getExperts,
  assignExpert, updateClaimStatus,
  addClaimDocuments, submitExpertReport,
} from '@/lib/db';
import type { Claim, ClaimStatus, Expert } from '@/lib/types';
import { ChatPanel } from '@/components/chat-panel';
import { ClaimStatusBadge } from '@/components/claim-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  ArrowLeft, Calendar, CheckCircle2, Clock, Camera,
  Download, Euro, FileArchive, FileText, ImageIcon,
  Mail, MapPin, MessageSquare, Paperclip, Phone,
  Save, Send, Star, Upload, UserCheck, X, BrainCircuit,
} from 'lucide-react';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// ─── Constants ───────────────────────────────────────────────────────────────

export type ClaimRole = 'client' | 'gestor' | 'admin' | 'perit';

const ALL_STATUSES: ClaimStatus[] = [
  'Declarat', 'En validació', 'Documentació pendent', 'En avaluació',
  'En peritació', 'Informe rebut', 'Aprovat', 'Pagat', 'Tancat', 'Denegat',
];

const STEPPER_STEPS = ['Declarat', 'En curs', 'Aprovat', 'Pagat', 'Tancat'] as const;

function getStepperIndex(status: ClaimStatus): number {
  switch (status) {
    case 'Declarat': return 0;
    case 'En validació': case 'Documentació pendent':
    case 'En avaluació': case 'En peritació': case 'Informe rebut': return 1;
    case 'Aprovat': return 2;
    case 'Pagat': return 3;
    case 'Tancat': return 4;
    case 'Denegat': return -1;
    default: return 0;
  }
}

const PHOTO_PLACEHOLDER = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f1f5f9' rx='4'/%3E%3Cpath d='M35 65 L35 45 L40 38 L60 38 L65 45 L65 65 Z' stroke='%2394a3b8' fill='none' stroke-width='2' stroke-linejoin='round'/%3E%3Ccircle cx='50' cy='54' r='8' stroke='%2394a3b8' fill='none' stroke-width='2'/%3E%3C/svg%3E";

const DOC_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip';

function photoError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = PHOTO_PLACEHOLDER;
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function docIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['zip', 'rar', '7z'].includes(ext)) return <FileArchive className="h-4 w-4 text-amber-500 flex-shrink-0" />;
  return <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ClaimDetailViewProps {
  claimId: string;
  role: ClaimRole;
  backHref: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ClaimDetailView({ claimId, role, backHref }: ClaimDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // ── Shared ──
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Client ──
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const clientDocRef = useRef<HTMLInputElement>(null);

  // ── Backoffice (gestor + admin) ──
  const [experts, setExperts] = useState<Expert[]>([]);
  const [assignedExpert, setAssignedExpert] = useState<Expert | null>(null);
  const [newStatus, setNewStatus] = useState<ClaimStatus>('Declarat');
  const [noteText, setNoteText] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [isExpertDialogOpen, setIsExpertDialogOpen] = useState(false);

  // ── Admin ──
  const [assessment, setAssessment] = useState<{ damageSummary: string; suggestedClaimCategory: string; keyEntities: string[] } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // ── Perit ──
  const [reportText, setReportText] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [reportDocFiles, setReportDocFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const peritPhotoRef = useRef<HTMLInputElement>(null);
  const peritDocRef = useRef<HTMLInputElement>(null);

  // ── Data fetching ──
  useEffect(() => {
    (async () => {
      try {
        const c = await getClaimById(claimId);
        setClaim(c);
        if (!c) return;

        if (role === 'client') {
          if (c.assignedExpertId) {
            const e = await getExpertById(c.assignedExpertId);
            setAssignedExpert(e);
          }
        } else if (role === 'gestor' || role === 'admin') {
          const [allExperts] = await Promise.all([getExperts()]);
          setExperts(allExperts);
          if (c.assignedExpertId) {
            const e = allExperts.find(ex => ex.id === c.assignedExpertId) ?? null;
            setAssignedExpert(e);
          }
          setNewStatus(c.status);
          setNoteText(c.notes ?? '');
        } else if (role === 'perit') {
          setReportText(c.report ?? '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [claimId, role]);

  // ── Handlers: client ──
  const handleClientUploadDocs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !claim) return;
    setUploadingDocs(true);
    try {
      await addClaimDocuments(claim.id, files);
      const fresh = await getClaimById(claim.id);
      if (fresh) setClaim(fresh);
      toast({ title: 'Documentació enviada correctament' });
    } catch {
      toast({ title: 'Error en pujar la documentació', variant: 'destructive' });
    } finally {
      setUploadingDocs(false);
      e.target.value = '';
    }
  };

  // ── Handlers: backoffice ──
  const handleAssignExpert = async (expert: Expert) => {
    if (!claim) return;
    try {
      await assignExpert(claim.id, expert.id);
      setClaim(prev => prev ? { ...prev, assignedExpertId: expert.id, status: 'En peritació', updatedAt: new Date() } : prev);
      setAssignedExpert(expert);
      setNewStatus('En peritació');
      toast({ title: 'Perit assignat', description: `${expert.name} assignat al sinistre ${claim.number}.` });
    } catch {
      toast({ title: "Error en l'assignació", variant: 'destructive' });
    }
    setIsExpertDialogOpen(false);
  };

  const handleSaveStatus = async () => {
    if (!claim) return;
    setSavingStatus(true);
    try {
      await updateClaimStatus(claim.id, newStatus, noteText);
      setClaim(prev => prev ? { ...prev, status: newStatus, notes: noteText, updatedAt: new Date() } : prev);
      toast({ title: 'Sinistre actualitzat correctament' });
    } catch (err) {
      toast({ title: "Error en l'actualització", description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally {
      setSavingStatus(false);
    }
  };

  // ── Handlers: admin AI ──
  const handleAIAnalyze = async () => {
    if (!claim) return;
    setLoadingAI(true);
    try {
      const { aiClaimInitialAssessment } = await import('@/ai/flows/ai-claim-initial-assessment');
      const result = await aiClaimInitialAssessment({ description: claim.description, photos: claim.photos });
      setAssessment(result);
    } catch {
      toast({ title: "Error en l'anàlisi IA", variant: 'destructive' });
    } finally {
      setLoadingAI(false);
    }
  };

  // ── Handlers: perit ──
  const handlePeritPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPhotoFiles(prev => [...prev, ...files]);
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const handlePeritDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReportDocFiles(prev => [...prev, ...Array.from(e.target.files ?? [])]);
    e.target.value = '';
  };

  const handleSubmitReport = async () => {
    if (!claim || !reportText.trim()) return;
    setSubmitting(true);
    try {
      await submitExpertReport(claim.id, reportText, photoFiles, reportDocFiles);
      const updated = { ...claim, report: reportText, status: 'Informe rebut' as const };
      setClaim(updated);
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setReportDocFiles([]);
      toast({ title: 'Informe enviat correctament', description: 'El gestor ha estat notificat.' });
    } catch {
      toast({ title: "Error en l'enviament", variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / Not found ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-muted-foreground">Carregant...</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <p className="text-muted-foreground text-sm">Sinistre no trobat.</p>
        <Button variant="ghost" onClick={() => router.push(backHref)}>Tornar</Button>
      </div>
    );
  }

  const currentStep = getStepperIndex(claim.status);
  const isDenied = claim.status === 'Denegat';
  const isClosed = claim.status === 'Tancat' || isDenied;
  const isReportSubmitted = claim.status === 'Informe rebut';

  // ─────────────────────────────────────────────────────────────────────────
  // Shared sections
  // ─────────────────────────────────────────────────────────────────────────

  const InfoCard = () => (
    <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
      <CardContent className="p-5 divide-y divide-slate-100">
        {claim.incidentAt && (
          <div className="flex items-center justify-between py-3 first:pt-0">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Data del sinistre</span>
            <span className="text-xs font-semibold">{format(claim.incidentAt, "d MMM yyyy", { locale: ca })}</span>
          </div>
        )}
        <div className="flex items-center justify-between py-3 first:pt-0">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Data declaració</span>
          <span className="text-xs font-semibold">{format(claim.createdAt, "d MMM yyyy", { locale: ca })}</span>
        </div>
        {claim.location && (
          <div className="flex items-center justify-between py-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Ubicació</span>
            <span className="text-xs font-mono">{claim.location.lat.toFixed(4)}°N {claim.location.lng.toFixed(4)}°E</span>
          </div>
        )}
        {claim.estimatedCost != null && (
          <div className="flex items-center justify-between py-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Euro className="h-3.5 w-3.5" /> Estimació econòmica</span>
            <span className="text-sm font-bold text-primary">{claim.estimatedCost.toLocaleString('ca-ES')} €</span>
          </div>
        )}
        {claim.description && (
          <div className="pt-3 last:pb-0 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Descripció</span>
            <p className="text-sm leading-relaxed">{claim.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const PhotosSection = ({ cols = 3 }: { cols?: number }) => claim.photos.length > 0 ? (
    <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
      <CardContent className="p-5 space-y-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="h-3 w-3" /> Fotografies ({claim.photos.length})
        </p>
        <div className={cn("grid gap-2", cols === 4 ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-3 sm:grid-cols-4")}>
          {claim.photos.map((url, idx) => (
            <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
              <img src={url} alt={`Foto ${idx + 1}`} referrerPolicy="no-referrer"
                className="w-full aspect-square object-cover rounded-xl border border-border/60 hover:opacity-80 transition-opacity bg-muted"
                onError={photoError} />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  ) : null;

  const ReportBlock = () => claim.report ? (
    <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
      <CardContent className="p-5 space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Informe del perit</p>
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{claim.report}</p>
        </div>
      </CardContent>
    </Card>
  ) : null;

  const AssignExpertSection = () => (
    <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
      <CardContent className="p-5 space-y-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Perit assignat</p>
        {assignedExpert ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="h-9 w-9 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">
              {initials(assignedExpert.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-900">{assignedExpert.name}</p>
              <p className="text-xs text-emerald-600">{assignedExpert.specialty} · {assignedExpert.zone}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Cap perit assignat.</p>
        )}
        <Dialog open={isExpertDialogOpen} onOpenChange={setIsExpertDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full text-xs gap-2 h-9 rounded-xl">
              <UserCheck className="h-3.5 w-3.5" />
              {assignedExpert ? 'Reassignar perit' : 'Assignar perit'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[95vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Seleccionar perit</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto">
              {experts.map(expert => (
                <div key={expert.id}
                  className={cn(
                    "p-3 border rounded-xl hover:bg-muted/20 cursor-pointer transition-colors flex justify-between items-center group",
                    claim.assignedExpertId === expert.id && "border-emerald-500 bg-emerald-50/50"
                  )}
                  onClick={() => handleAssignExpert(expert)}>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm group-hover:text-primary">{expert.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5">{expert.specialty}</Badge>
                      <span>{expert.zone}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                      <Star className="h-3 w-3 fill-amber-500" /> {expert.rating}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{expert.activeClaims} casos</p>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );

  const StatusNotesSection = () => (
    <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
      <CardContent className="p-5 space-y-4">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Estat del sinistre</p>
          <Select value={newStatus} onValueChange={v => setNewStatus(v as ClaimStatus)}>
            <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Notes internes <span className="normal-case font-normal">(no visibles al client)</span>
          </p>
          <Textarea value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Afegeix notes de gestió interna..."
            className="text-xs min-h-[100px] resize-none rounded-xl" />
        </div>
        <Button className="w-full text-xs h-9 font-semibold gap-2 rounded-xl" onClick={handleSaveStatus} disabled={savingStatus}>
          <Save className="h-3.5 w-3.5" />
          {savingStatus ? 'Desant...' : 'Desar canvis'}
        </Button>
      </CardContent>
    </Card>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render tabs per role
  // ─────────────────────────────────────────────────────────────────────────

  const renderTabs = () => {
    // ── CLIENT ──
    if (role === 'client') {
      return (
        <Tabs defaultValue="detalls" className="w-full">
          <TabsList className="w-full shadow-sm">
            <TabsTrigger value="detalls" className="flex-1">Detalls</TabsTrigger>
            <TabsTrigger value="chat" className="flex-1">Gestor</TabsTrigger>
          </TabsList>

          <TabsContent value="detalls" className="space-y-4 mt-4">
            {/* Estat + stepper */}
            <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
              <CardContent className="p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Estat del sinistre</span>
                  <span className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-md",
                    isDenied ? "bg-red-100 text-red-700"
                    : isClosed ? "bg-slate-100 text-slate-600"
                    : claim.status === 'Documentació pendent' ? "bg-amber-100 text-amber-700"
                    : "bg-primary/10 text-primary"
                  )}>{claim.status}</span>
                </div>
                {isDenied ? (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
                    El sinistre ha estat denegat. Posa&apos;t en contacte amb el teu gestor per a més informació.
                  </div>
                ) : (
                  <div className="relative flex items-start justify-between pt-1">
                    <div className="absolute top-[11px] left-3 right-3 h-px bg-slate-200" />
                    <div className="absolute top-[11px] left-3 h-px bg-primary transition-all duration-500"
                      style={{ width: currentStep === 0 ? '0%' : `calc(${(currentStep / (STEPPER_STEPS.length - 1)) * 100}% - 1.5rem + ${(currentStep / (STEPPER_STEPS.length - 1)) * 1.5}rem)` }} />
                    {STEPPER_STEPS.map((s, i) => {
                      const done = i < currentStep;
                      const active = i === currentStep;
                      return (
                        <div key={s} className="relative z-10 flex flex-col items-center gap-2" style={{ flex: 1 }}>
                          <div className={cn("w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center bg-white transition-all",
                            done ? "border-primary bg-primary" : active ? "border-primary" : "border-slate-300")}>
                            {done && <CheckCircle2 className="w-3 h-3 text-white fill-white stroke-none" />}
                            {active && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <span className={cn("text-[9px] font-semibold text-center leading-tight max-w-[44px]",
                            done || active ? "text-primary" : "text-slate-400")}>{s}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <InfoCard />
            <PhotosSection />

            {assignedExpert && (
              <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
                <CardContent className="p-5 space-y-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Perit assignat</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                      {initials(assignedExpert.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{assignedExpert.name}</p>
                      <p className="text-xs text-muted-foreground">{assignedExpert.specialty} · {assignedExpert.zone}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 border-t border-slate-100 pt-4">
                    {assignedExpert.phone && (
                      <a href={`tel:${assignedExpert.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                        <Phone className="h-3.5 w-3.5" /> Trucar
                      </a>
                    )}
                    {assignedExpert.email && (
                      <a href={`mailto:${assignedExpert.email}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                        <Mail className="h-3.5 w-3.5" /> Escriure
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {claim.documents.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
                  <Paperclip className="h-3 w-3" /> Documents ({claim.documents.length})
                </p>
                <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
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

            {claim.status === 'Documentació pendent' && (
              <Card className="rounded-2xl border border-amber-200 bg-amber-50 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-2">
                    <Upload className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Documentació pendent</p>
                      <p className="text-xs text-amber-700 mt-0.5">El teu gestor necessita documentació addicional.</p>
                    </div>
                  </div>
                  <input ref={clientDocRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip" className="hidden" onChange={handleClientUploadDocs} />
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2" onClick={() => clientDocRef.current?.click()} disabled={uploadingDocs}>
                    <Upload className="h-4 w-4" />
                    {uploadingDocs ? 'Pujant...' : 'Pujar documentació'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden bg-white">
              <div className="h-[calc(100dvh-240px)] flex flex-col">
                <ChatPanel claimId={claim.id} senderRole="user" initialMessages={claim.messages} />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      );
    }

    // ── GESTOR ──
    if (role === 'gestor') {
      return (
        <Tabs defaultValue="declaracio" className="w-full">
          <TabsList className="w-full shadow-sm">
            <TabsTrigger value="declaracio" className="flex-1">Declaració</TabsTrigger>
            <TabsTrigger value="gestio" className="flex-1">Gestió</TabsTrigger>
            <TabsTrigger value="chat" className="flex-1 gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Chat
              {claim.messages.length > 0 && (
                <span className="bg-primary text-white rounded-full text-[9px] px-1.5 leading-4">{claim.messages.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="declaracio" className="space-y-4 mt-4">
            <InfoCard />
            <PhotosSection />
            <ReportBlock />
          </TabsContent>

          <TabsContent value="gestio" className="space-y-4 mt-4">
            <AssignExpertSection />
            <StatusNotesSection />
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden bg-white">
              <div className="h-[calc(100dvh-280px)] flex flex-col">
                <ChatPanel claimId={claim.id} senderRole="manager" initialMessages={claim.messages} />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      );
    }

    // ── ADMIN ──
    if (role === 'admin') {
      return (
        <Tabs defaultValue="declaracio" className="w-full">
          <TabsList className="w-full shadow-sm">
            <TabsTrigger value="declaracio" className="flex-1">Declaració</TabsTrigger>
            <TabsTrigger value="informe" className="flex-1 gap-1">
              Informe {claim.report && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
            </TabsTrigger>
            <TabsTrigger value="gestio" className="flex-1">Gestió</TabsTrigger>
            <TabsTrigger value="chat" className="flex-1 gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Chat
              {claim.messages.length > 0 && (
                <span className="bg-primary text-white rounded-full text-[9px] px-1.5 leading-4">{claim.messages.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="declaracio" className="space-y-4 mt-4">
            <InfoCard />
            <PhotosSection cols={4} />
          </TabsContent>

          <TabsContent value="informe" className="space-y-4 mt-4">
            {claim.report ? (
              <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
                <CardContent className="p-5 space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Informe tècnic</p>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{claim.report}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  L&apos;informe del perit encara no s&apos;ha rebut.
                </CardContent>
              </Card>
            )}
            {assignedExpert && (
              <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
                <CardContent className="p-5 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {initials(assignedExpert.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{assignedExpert.name}</p>
                    <p className="text-xs text-muted-foreground">{assignedExpert.specialty} · {assignedExpert.zone}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {claim.documents.length > 0 && (
              <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
                <CardContent className="p-5 space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Documents annexos</p>
                  {claim.documents.map((doc, idx) => (
                    <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      {docIcon(doc.name)}
                      <span className="text-xs flex-1 truncate font-medium">{doc.name}</span>
                      <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="gestio" className="space-y-4 mt-4">
            <AssignExpertSection />
            <StatusNotesSection />
            <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
              <CardContent className="p-5 space-y-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Avaluació IA</p>
                <Button className="gap-2 bg-secondary hover:bg-secondary/90 h-9 rounded-xl w-full" onClick={handleAIAnalyze} disabled={loadingAI}>
                  <BrainCircuit className="h-4 w-4" />
                  {loadingAI ? 'Analitzant...' : 'Generar avaluació IA'}
                </Button>
                {assessment && (
                  <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-sm space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 font-semibold text-emerald-400">
                      <BrainCircuit className="h-4 w-4" /> Resultat IA
                    </div>
                    <p className="leading-relaxed text-slate-300">{assessment.damageSummary}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-xs">{assessment.suggestedClaimCategory}</Badge>
                      {assessment.keyEntities.map((ent, i) => (
                        <Badge key={i} variant="outline" className="text-slate-400 border-slate-700 text-xs">{ent}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden bg-white">
              <div className="h-[calc(100dvh-280px)] flex flex-col">
                <ChatPanel claimId={claim.id} senderRole="manager" initialMessages={claim.messages} />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      );
    }

    // ── PERIT ──
    return (
      <Tabs defaultValue="declaracio" className="w-full">
        <TabsList className="w-full shadow-sm">
          <TabsTrigger value="declaracio" className="flex-1">Declaració</TabsTrigger>
          <TabsTrigger value="informe" className="flex-1">Informe tècnic</TabsTrigger>
        </TabsList>

        <TabsContent value="declaracio" className="space-y-4 mt-4">
          <InfoCard />
          <PhotosSection />
        </TabsContent>

        <TabsContent value="informe" className="space-y-4 mt-4">
          <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
            <CardContent className="p-5 space-y-5">
              <Textarea
                value={reportText}
                onChange={e => setReportText(e.target.value)}
                placeholder="Descriu les conclusions tècniques: causa del sinistre, danys observats, valoració econòmica estimada, recomanacions..."
                className="min-h-[160px] text-sm resize-none"
                disabled={isReportSubmitted}
              />

              {/* Fotos de l'informe */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fotografies de l&apos;informe</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {!isReportSubmitted && (
                    <>
                      <input ref={peritPhotoRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePeritPhotoChange} />
                      <button onClick={() => peritPhotoRef.current?.click()}
                        className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-muted flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/20 transition-colors">
                        <Camera className="h-5 w-5 mb-1" />
                        <span className="text-[9px] font-semibold">AFEGIR</span>
                      </button>
                    </>
                  )}
                  {photoPreviews.map((url, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      <img src={url} alt={`Nova foto ${idx + 1}`} className="w-20 h-20 object-cover rounded-xl border border-border/60" />
                      <button onClick={() => { setPhotoFiles(p => p.filter((_, i) => i !== idx)); setPhotoPreviews(p => p.filter((_, i) => i !== idx)); }}
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full h-5 w-5 flex items-center justify-center shadow">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {photoPreviews.length === 0 && isReportSubmitted && (
                    <p className="text-xs text-muted-foreground py-2">Sense fotografies adjuntes.</p>
                  )}
                </div>
              </div>

              {/* Documents annexos */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Documents annexos</p>
                {reportDocFiles.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {reportDocFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-blue-200 bg-blue-50/50">
                        {docIcon(file.name)}
                        <span className="text-xs font-medium flex-1 truncate text-blue-900">{file.name}</span>
                        <span className="text-[10px] text-blue-500 mr-1">nou</span>
                        <button onClick={() => setReportDocFiles(p => p.filter((_, i) => i !== idx))}
                          className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {!isReportSubmitted && (
                  <>
                    <input ref={peritDocRef} type="file" accept={DOC_ACCEPT} multiple className="hidden" onChange={handlePeritDocChange} />
                    <button onClick={() => peritDocRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-muted text-muted-foreground hover:bg-muted/20 transition-colors text-xs font-medium w-full justify-center">
                      <Paperclip className="h-3.5 w-3.5" />
                      Annexar document (PDF, Word, Excel…)
                    </button>
                  </>
                )}
              </div>

              {isReportSubmitted ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  Informe enviat. El gestor el revisarà aviat.
                </div>
              ) : (
                <Button className="w-full gap-2 font-semibold" disabled={!reportText.trim() || submitting} onClick={handleSubmitReport}>
                  <Send className="h-4 w-4" />
                  {submitting ? 'Enviant...' : 'Enviar informe al gestor'}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(backHref)} className="-ml-2 mt-0.5 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
            {claim.number} · {format(claim.createdAt, "d 'de' MMMM yyyy", { locale: ca })}
          </p>
          <h1 className="text-xl font-bold text-foreground leading-snug capitalize">
            {claim.title || claim.type}
          </h1>
        </div>
        <ClaimStatusBadge status={claim.status} />
      </div>

      {renderTabs()}
    </div>
  );
}
