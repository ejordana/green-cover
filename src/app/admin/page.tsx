
"use client";

import { useState, useMemo, useEffect } from 'react';
import { getClaims, getClaimById, getExperts, assignExpert, updateClaimStatus } from '@/lib/db';
import { ChatPanel } from '@/components/chat-panel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ClaimStatusBadge } from '@/components/claim-status-badge';
import { Filter, BrainCircuit, ExternalLink, Clock, UserCheck, Star, ArrowLeft, MessageSquare, Save, Search } from 'lucide-react';
import { PortalHeader } from '@/components/portal-header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { aiClaimInitialAssessment } from '@/ai/flows/ai-claim-initial-assessment';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Claim, Expert, ClaimStatus } from '@/lib/types';

const ALL_STATUSES: ClaimStatus[] = [
  'Declarat', 'Perit designat',
  'Informe rebut', 'Aprovat', 'Pagat', 'Tancat',
];

const PHOTO_PLACEHOLDER = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f1f5f9' rx='4'/%3E%3Cpath d='M35 65 L35 45 L40 38 L60 38 L65 45 L65 65 Z' stroke='%2394a3b8' fill='none' stroke-width='2' stroke-linejoin='round'/%3E%3Ccircle cx='50' cy='54' r='8' stroke='%2394a3b8' fill='none' stroke-width='2'/%3E%3C/svg%3E";

function showPhotoPlaceholder(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = PHOTO_PLACEHOLDER;
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function AdminBackOffice() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isExpertDialogOpen, setIsExpertDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ClaimStatus>('Declarat');
  const [noteText, setNoteText] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getClaims().then(setClaims).catch(console.error);
    getExperts().then(setExperts).catch(console.error);
  }, []);

  const selectedClaim = useMemo(() =>
    claims.find(c => c.id === selectedClaimId) || null,
    [claims, selectedClaimId]
  );

  useEffect(() => {
    if (!selectedClaimId) return;
    setAssessment(null);
    getClaimById(selectedClaimId).then(fresh => {
      if (!fresh) return;
      setClaims(prev => prev.map(c => c.id === fresh.id ? fresh : c));
      setNewStatus(fresh.status);
      setNoteText(fresh.notes ?? '');
    }).catch(console.error);
  }, [selectedClaimId]);

  const assignedExpert = useMemo(() => {
    if (!selectedClaim?.assignedExpertId) return null;
    return experts.find(e => e.id === selectedClaim.assignedExpertId);
  }, [selectedClaim, experts]);

  const handleAIAnalyze = async (claim: Claim) => {
    setLoading(true);
    try {
      const result = await aiClaimInitialAssessment({
        description: claim.description,
        photos: claim.photos
      });
      setAssessment(result);
    } catch (e) {
      toast({
        title: "Error en l'anàlisi",
        description: "No s'ha pogut completar l'avaluació IA en aquest moment.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignExpert = async (expert: Expert) => {
    if (!selectedClaimId) return;
    try {
      await assignExpert(selectedClaimId, expert.id);
      setClaims(prev => prev.map(c =>
        c.id === selectedClaimId
          ? { ...c, assignedExpertId: expert.id, status: 'Perit designat' as const, updatedAt: new Date() }
          : c
      ));
      toast({
        title: "Perit assignat",
        description: `${expert.name} ha estat assignat al sinistre ${selectedClaim?.number}. L'estat ha canviat a 'Perit designat'.`,
      });
    } catch {
      toast({ title: "Error en l'assignació", variant: "destructive" });
    }
    setIsExpertDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PortalHeader
        title="Back-office"
        navItems={[
          { label: 'Sinistres', href: '/admin', active: true },
          { label: 'Clients', href: '/admin/clients', active: false },
          { label: 'Gestors', href: '/admin/managers', active: false },
          { label: 'Perits', href: '/admin/experts', active: false },
          { label: 'Usuaris', href: '/admin/users', active: false },
        ]}
        userName="Roger Jordana"
        userInitials="RJ"
        userSubtitle="Administrador"
      />

      {/* Layout: sidebar fixa + panell principal, ocupen tota l’alçada */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-52px)]">

        {/* Sidebar — llista de sinistres */}
        <aside className={cn(
          "w-80 shrink-0 border-r border-border/60 bg-white flex flex-col",
          selectedClaimId ? "hidden lg:flex" : "flex"
        )}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <span className="text-sm font-semibold">Sinistres</span>
            <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" /> Filtres
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {claims.map((claim) => (
              <button
                key={claim.id}
                onClick={() => { setSelectedClaimId(claim.id); setAssessment(null); }}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors",
                  selectedClaimId === claim.id && "bg-primary/5 border-l-2 border-primary"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-foreground">{claim.number}</span>
                  <ClaimStatusBadge status={claim.status} className="text-[10px] px-1.5 py-0 shrink-0" />
                </div>
                <p className="text-sm font-medium text-foreground truncate">{claim.title || claim.type}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{claim.type}</p>
              </button>
            ))}
            {claims.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-12">Cap sinistre.</p>
            )}
          </div>
        </aside>

        {/* Panell principal */}
        <main className={cn(
          "flex-1 overflow-hidden flex flex-col",
          !selectedClaimId && "hidden lg:flex"
        )}>
          {selectedClaim ? (
            <div className="flex flex-col h-full">
              {/* Capçalera del detall */}
              <div className="flex items-center gap-3 px-6 py-3 border-b border-border/60 bg-white shrink-0">
                <button
                  onClick={() => setSelectedClaimId(null)}
                  className="lg:hidden p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{selectedClaim.number} · <span className="capitalize">{selectedClaim.type}</span></p>
                  <p className="text-base font-bold truncate">{selectedClaim.title || selectedClaim.type}</p>
                </div>
                <ClaimStatusBadge status={selectedClaim.status} />
              </div>

              {/* Tabs */}
              <Tabs defaultValue="detail" className="flex flex-col flex-1 min-h-0">
                <TabsList className="w-full rounded-none border-b h-10 bg-white px-6 justify-start gap-6 flex-shrink-0">
                  <TabsTrigger value="detail" className="text-xs h-10 px-0 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                    Declaració
                  </TabsTrigger>
                  <TabsTrigger value="report" className="text-xs h-10 px-0 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none gap-1.5">
                    Informe
                    {selectedClaim.report && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                  </TabsTrigger>
                  <TabsTrigger value="gestio" className="text-xs h-10 px-0 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                    Gestió
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="text-xs h-10 px-0 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Chat
                    {selectedClaim.messages.length > 0 && (
                      <span className="bg-primary text-white rounded-full text-[9px] px-1.5 leading-4">{selectedClaim.messages.length}</span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: Declaració */}
                <TabsContent value="detail" className="flex-1 overflow-y-auto p-6 space-y-5 mt-0">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Descripció</p>
                    <p className="text-sm leading-relaxed">{selectedClaim.description}</p>
                  </div>
                  {selectedClaim.photos.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fotografies ({selectedClaim.photos.length})</p>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedClaim.photos.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`Foto ${idx + 1}`} referrerPolicy="no-referrer"
                              className="w-full aspect-square object-cover rounded-lg border border-border/60 hover:opacity-80 transition-opacity bg-muted"
                              onError={showPhotoPlaceholder} />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sense fotografies adjuntades.</p>
                  )}
                </TabsContent>

                {/* TAB 2: Informe */}
                <TabsContent value="report" className="flex-1 overflow-y-auto p-6 space-y-4 mt-0">
                  {selectedClaim.report ? (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 space-y-1.5">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Informe tècnic</p>
                      <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{selectedClaim.report}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
                      <p className="text-sm font-medium">L’informe del perit encara no s’ha rebut.</p>
                      <p className="text-xs mt-1">L’estat canviarà a "Informe rebut" quan el perit l’enviï.</p>
                    </div>
                  )}
                  {assignedExpert && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {initials(assignedExpert.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{assignedExpert.name}</p>
                        <p className="text-xs text-muted-foreground">{assignedExpert.specialty} · {assignedExpert.zone}</p>
                      </div>
                    </div>
                  )}
                  {selectedClaim.documents.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documents annexos</p>
                      {selectedClaim.documents.map((doc, idx) => (
                        <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 hover:bg-muted/20 transition-colors">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs flex-1 truncate font-medium">{doc.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* TAB 3: Gestió */}
                <TabsContent value="gestio" className="flex-1 overflow-y-auto p-6 space-y-5 mt-0">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {/* Perit */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Perit</p>
                      {assignedExpert && (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                            {initials(assignedExpert.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-900">{assignedExpert.name}</p>
                            <p className="text-xs text-emerald-600">{assignedExpert.specialty}</p>
                          </div>
                        </div>
                      )}
                      <Dialog open={isExpertDialogOpen} onOpenChange={setIsExpertDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full gap-2 h-9 text-sm">
                            <UserCheck className="h-4 w-4" />
                            {assignedExpert ? "Reassignar perit" : "Assignar perit"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md w-[95vw] rounded-xl">
                          <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Seleccionar Perit</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto">
                            {experts.map((expert) => (
                              <div key={expert.id}
                                className={cn(
                                  "p-3 border rounded-xl hover:bg-muted/20 cursor-pointer transition-colors flex justify-between items-center group",
                                  selectedClaim.assignedExpertId === expert.id && "border-emerald-500 bg-emerald-50/50"
                                )}
                                onClick={() => handleAssignExpert(expert)}>
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-sm group-hover:text-primary">{expert.name}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-xs py-0 px-1.5">{expert.specialty}</Badge>
                                    <span>{expert.zone}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                                    <Star className="h-3 w-3 fill-amber-500" /> {expert.rating}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{expert.activeClaims} casos</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Estat i notes */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estat</p>
                      <Select value={newStatus} onValueChange={v => setNewStatus(v as ClaimStatus)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_STATUSES.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes internes</p>
                      <Textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                        placeholder="Afegeix notes de gestió interna..."
                        className="min-h-[80px] resize-none" />
                      <Button className="w-full gap-2 h-9" onClick={async () => {
                        if (!selectedClaimId) return;
                        setSavingStatus(true);
                        try {
                          await updateClaimStatus(selectedClaimId, newStatus, noteText);
                          setClaims(prev => prev.map(c =>
                            c.id === selectedClaimId ? { ...c, status: newStatus, notes: noteText, updatedAt: new Date() } : c
                          ));
                          toast({ title: "Sinistre actualitzat correctament" });
                        } catch {
                          toast({ title: "Error en l’actualització", variant: "destructive" });
                        } finally { setSavingStatus(false); }
                      }} disabled={savingStatus}>
                        <Save className="h-4 w-4" />
                        {savingStatus ? "Desant..." : "Desar canvis"}
                      </Button>
                    </div>
                  </div>

                  {/* IA */}
                  <div className="space-y-3 pt-2 border-t border-border/60">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avaluació IA</p>
                    <Button className="gap-2 bg-secondary hover:bg-secondary/90 h-9"
                      onClick={() => handleAIAnalyze(selectedClaim)} disabled={loading}>
                      <BrainCircuit className="h-4 w-4" />
                      {loading ? "Analitzant..." : "Generar avaluació IA"}
                    </Button>
                    {assessment && (
                      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-sm space-y-3 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 font-semibold text-emerald-400">
                          <BrainCircuit className="h-4 w-4" /> Resultat IA
                        </div>
                        <p className="leading-relaxed text-slate-300">{assessment.damageSummary}</p>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-xs">{assessment.suggestedClaimCategory}</Badge>
                          {assessment.keyEntities.map((ent: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-slate-400 border-slate-700 text-xs">{ent}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 4: Chat */}
                <TabsContent value="chat" className="mt-0 flex-1 flex flex-col min-h-0">
                  <ChatPanel claimId={selectedClaim.id} senderRole="manager" initialMessages={selectedClaim.messages} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Search className="h-10 w-10 opacity-20 mb-3" />
              <p className="text-sm font-medium">Selecciona un sinistre per veure’n els detalls</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
