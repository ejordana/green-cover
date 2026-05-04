
"use client";

import { useState, useMemo, useEffect } from 'react';
import { getClaims, getClaimById, getExperts, assignExpert, updateClaimStatus } from '@/lib/db';
import { ChatPanel } from '@/components/chat-panel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ClaimStatusBadge } from '@/components/claim-status-badge';
import { Shield, Search, Filter, BrainCircuit, ExternalLink, Clock, UserCheck, Star, ArrowLeft, MessageSquare, Save } from 'lucide-react';
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
  'Declarat', 'Gestor assignat', 'Perit designat',
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
    <div className="min-h-screen bg-[hsl(210_20%_98%)] flex flex-col">
      <header className="bg-white border-b border-border/60 sticky top-0 z-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 max-w-7xl mx-auto w-full px-4 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-80 transition-opacity flex items-center gap-2.5">
              <div className="bg-primary p-2 rounded-xl">
                <Shield className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <h1 className="text-base font-bold text-primary leading-tight">GreenCover</h1>
                <p className="text-[10px] text-muted-foreground font-medium leading-tight">Back-office</p>
              </div>
            </Link>
            <div className="h-6 w-px bg-border hidden md:block" />
            <nav className="hidden md:flex gap-1 bg-muted/60 p-1 rounded-lg">
              <Link href="/admin">
                <Button variant="default" size="sm" className="h-7 text-xs font-semibold px-3">Sinistres</Button>
              </Link>
              <Link href="/admin/clients">
                <Button variant="ghost" size="sm" className="h-7 text-xs font-medium px-3 text-muted-foreground hover:text-foreground">Clients</Button>
              </Link>
              <Link href="/admin/managers">
                <Button variant="ghost" size="sm" className="h-7 text-xs font-medium px-3 text-muted-foreground hover:text-foreground">Gestors</Button>
              </Link>
              <Link href="/admin/experts">
                <Button variant="ghost" size="sm" className="h-7 text-xs font-medium px-3 text-muted-foreground hover:text-foreground">Perits</Button>
              </Link>
            </nav>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <nav className="flex gap-1 bg-muted/60 p-1 rounded-lg md:hidden">
              <Link href="/admin">
                <Button variant="default" size="sm" className="h-7 text-xs font-semibold px-3">Sinistres</Button>
              </Link>
              <Link href="/admin/clients">
                <Button variant="ghost" size="sm" className="h-7 text-xs px-3 text-muted-foreground">Clients</Button>
              </Link>
              <Link href="/admin/managers">
                <Button variant="ghost" size="sm" className="h-7 text-xs px-3 text-muted-foreground">Gestors</Button>
              </Link>
              <Link href="/admin/experts">
                <Button variant="ghost" size="sm" className="h-7 text-xs px-3 text-muted-foreground">Perits</Button>
              </Link>
            </nav>
            <div className="relative w-full sm:w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                placeholder="Cercar sinistre..."
                className="w-full pl-8 pr-3 h-8 text-xs rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className={cn("lg:col-span-8 space-y-5", selectedClaimId && "hidden lg:block")}>
          <Card className="border border-border/60 shadow-sm overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between py-3.5 px-5 border-b border-border/60">
              <CardTitle className="text-sm font-semibold">Sinistres</CardTitle>
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs font-medium">
                <Filter className="h-3 w-3" /> Filtres
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground pl-5">Referència</TableHead>
                      <TableHead className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Client</TableHead>
                      <TableHead className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground hidden sm:table-cell">Tipus</TableHead>
                      <TableHead className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Estat</TableHead>
                      <TableHead className="text-right pr-5"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((claim) => (
                      <TableRow
                        key={claim.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/20 transition-colors border-b border-border/40",
                          selectedClaimId === claim.id && "bg-primary/5 hover:bg-primary/5"
                        )}
                        onClick={() => { setSelectedClaimId(claim.id); setAssessment(null); }}
                      >
                        <TableCell className="font-semibold text-xs pl-5 text-foreground">{claim.number}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">Real Club Golf El Prat</TableCell>
                        <TableCell className="capitalize text-xs text-muted-foreground hidden sm:table-cell">{claim.type}</TableCell>
                        <TableCell><ClaimStatusBadge status={claim.status} className="text-[10px] px-2 py-0" /></TableCell>
                        <TableCell className="text-right pr-5">
                          <ExternalLink className="h-3 w-3 text-muted-foreground/40 inline" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={cn("lg:col-span-4", !selectedClaimId && "hidden lg:block")}>
          {selectedClaim ? (
            <Card className="border border-border/60 shadow-sm overflow-hidden bg-white sticky top-[73px] max-h-[calc(100vh-90px)] flex flex-col">
              {/* Capçalera fixa */}
              <div className="px-4 pt-3 pb-0 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2 lg:hidden">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedClaimId(null)} className="h-7 px-2 -ml-2">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Tornar
                  </Button>
                </div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{selectedClaim.number}</p>
                    <p className="text-sm font-semibold capitalize text-muted-foreground">{selectedClaim.type}</p>
                  </div>
                  <ClaimStatusBadge status={selectedClaim.status} />
                </div>
              </div>

              <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                <Tabs defaultValue="detail" className="flex flex-col flex-1 min-h-0">
                  <TabsList className="w-full rounded-none border-b border-t h-9 bg-transparent px-4 justify-start gap-4 flex-shrink-0">
                    <TabsTrigger value="detail" className="text-xs h-9 px-0 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                      Declaració
                    </TabsTrigger>
                    <TabsTrigger value="report" className="text-xs h-9 px-0 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none gap-1">
                      Informe
                      {selectedClaim.report && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />}
                    </TabsTrigger>
                    <TabsTrigger value="gestio" className="text-xs h-9 px-0 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                      Gestió
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="text-xs h-9 px-0 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none gap-1.5">
                      <MessageSquare className="h-3 w-3" />
                      Chat
                      {selectedClaim.messages.length > 0 && (
                        <span className="bg-primary text-white rounded-full text-[9px] px-1.5 py-0 leading-4">
                          {selectedClaim.messages.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB 1: Declaració del client */}
                  <TabsContent value="detail" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Descripció</p>
                      <p className="text-sm leading-relaxed">{selectedClaim.description}</p>
                    </div>

                    {selectedClaim.photos.length > 0 ? (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Fotografies ({selectedClaim.photos.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedClaim.photos.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={url}
                                alt={`Foto ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full aspect-square object-cover rounded-lg border border-border/60 hover:opacity-80 transition-opacity bg-muted"
                                onError={showPhotoPlaceholder}
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sense fotografies adjuntades.</p>
                    )}
                  </TabsContent>

                  {/* TAB 2: Informe del perit */}
                  <TabsContent value="report" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
                    {selectedClaim.report ? (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 space-y-1.5">
                        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Informe tècnic</p>
                        <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{selectedClaim.report}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-center">
                        <p className="text-sm font-medium">L’informe del perit encara no s’ha rebut.</p>
                        <p className="text-xs mt-1">L’estat canviarà a "Informe rebut" quan el perit l’enviï.</p>
                      </div>
                    )}

                    {selectedClaim.documents.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Documents annexos ({selectedClaim.documents.length})
                        </p>
                        <div className="space-y-1.5">
                          {selectedClaim.documents.map((doc, idx) => (
                            <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 hover:bg-muted/20 transition-colors group">
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs flex-1 truncate font-medium">{doc.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {assignedExpert && (
                      <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] flex-shrink-0">
                          {initials(assignedExpert.name)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{assignedExpert.name}</p>
                          <p className="text-[10px] text-muted-foreground">{assignedExpert.specialty} · {assignedExpert.zone}</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 3: Gestió */}
                  <TabsContent value="gestio" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-100 text-orange-800 text-xs font-semibold">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>SLA: Resten 14 hores per complir les 72h.</span>
                    </div>

                    {/* Perit */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Perit</p>
                      {assignedExpert && (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-3 mb-2">
                          <div className="h-8 w-8 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-[10px] flex-shrink-0">
                            {initials(assignedExpert.name)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-emerald-900">{assignedExpert.name}</p>
                            <p className="text-[10px] text-emerald-600">{assignedExpert.specialty}</p>
                          </div>
                        </div>
                      )}
                      <Dialog open={isExpertDialogOpen} onOpenChange={setIsExpertDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full text-xs gap-2 h-9">
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>{assignedExpert ? "Reassignar Perit" : "Assignar Perit Extern"}</span>
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
                    </div>

                    {/* IA */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Avaluació IA</p>
                      <Button className="w-full gap-2 bg-secondary hover:bg-secondary/90 h-9 text-xs font-semibold"
                        onClick={() => handleAIAnalyze(selectedClaim)} disabled={loading}>
                        <BrainCircuit className="h-4 w-4" />
                        <span>{loading ? "Analitzant..." : "Generar avaluació IA"}</span>
                      </Button>
                      {assessment && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-3 animate-in fade-in duration-300">
                          <div className="flex items-center gap-2 font-semibold text-emerald-400">
                            <BrainCircuit className="h-3.5 w-3.5" /> Resultat IA
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-semibold text-slate-500 mb-1">Resum de danys</p>
                            <p className="leading-relaxed text-slate-300">{assessment.damageSummary}</p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[9px] px-2 py-0">{assessment.suggestedClaimCategory}</Badge>
                            {assessment.keyEntities.map((ent, i) => (
                              <Badge key={i} variant="outline" className="text-slate-400 border-slate-700 text-[9px] px-2 py-0">{ent}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Estat i notes */}
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Estat del sinistre</p>
                      <Select value={newStatus} onValueChange={v => setNewStatus(v as ClaimStatus)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_STATUSES.map(s => (
                            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-1">
                        Notes internes <span className="normal-case font-normal">(no visibles al client)</span>
                      </p>
                      <Textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                        placeholder="Afegeix notes de gestió interna..."
                        className="text-xs min-h-[72px] resize-none" />

                      <Button className="w-full text-xs h-9 font-semibold gap-2"
                        onClick={async () => {
                          if (!selectedClaimId) return;
                          setSavingStatus(true);
                          try {
                            await updateClaimStatus(selectedClaimId, newStatus, noteText);
                            setClaims(prev => prev.map(c =>
                              c.id === selectedClaimId
                                ? { ...c, status: newStatus, notes: noteText, updatedAt: new Date() }
                                : c
                            ));
                            toast({ title: "Sinistre actualitzat correctament" });
                          } catch {
                            toast({ title: "Error en l’actualització", variant: "destructive" });
                          } finally {
                            setSavingStatus(false);
                          }
                        }}
                        disabled={savingStatus}>
                        <Save className="h-3.5 w-3.5" />
                        <span>{savingStatus ? "Desant..." : "Desar canvis"}</span>
                      </Button>
                    </div>
                  </TabsContent>

                  {/* TAB 4: Chat */}
                  <TabsContent value="chat" className="mt-0 flex-1 flex flex-col min-h-0">
                    <ChatPanel
                      claimId={selectedClaim.id}
                      senderRole="manager"
                      initialMessages={selectedClaim.messages}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground bg-white rounded-xl border border-dashed border-border p-12 text-center">
              <div className="bg-muted/50 p-5 rounded-2xl mb-4">
                <Search className="h-8 w-8 opacity-30" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Selecciona un sinistre per veure’n els detalls.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
