"use client";

import { useState, useMemo, useEffect } from 'react';
import { getClaims, getClaimById, getExperts, assignExpert, updateClaimStatus } from '@/lib/db';
import { ChatPanel } from '@/components/chat-panel';
import { ClaimStatusBadge } from '@/components/claim-status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, ArrowLeft, MessageSquare, Save, UserCheck, Star, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Claim, Expert, ClaimStatus } from '@/lib/types';

const ALL_STATUSES: ClaimStatus[] = [
  'Declarat',
  'Perit designat',
  'Informe rebut',
  'Aprovat',
  'Pagat',
  'Tancat',
];

const PHOTO_PLACEHOLDER = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f1f5f9' rx='4'/%3E%3Cpath d='M35 65 L35 45 L40 38 L60 38 L65 45 L65 65 Z' stroke='%2394a3b8' fill='none' stroke-width='2' stroke-linejoin='round'/%3E%3Ccircle cx='50' cy='54' r='8' stroke='%2394a3b8' fill='none' stroke-width='2'/%3E%3C/svg%3E";

function showPhotoPlaceholder(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = PHOTO_PLACEHOLDER;
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function GestorSinistresPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ClaimStatus | 'Tots'>('Tots');
  const [newStatus, setNewStatus] = useState<ClaimStatus>('Declarat');
  const [noteText, setNoteText] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [isExpertDialogOpen, setIsExpertDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getClaims().then(setClaims).catch(console.error);
    getExperts().then(setExperts).catch(console.error);
  }, []);

  const selectedClaim = useMemo(
    () => claims.find(c => c.id === selectedClaimId) || null,
    [claims, selectedClaimId]
  );

  useEffect(() => {
    if (!selectedClaimId) return;
    getClaimById(selectedClaimId).then(fresh => {
      if (!fresh) return;
      setClaims(prev => prev.map(c => c.id === fresh.id ? fresh : c));
      setNewStatus(fresh.status);
      setNoteText(fresh.notes ?? '');
    }).catch(console.error);
  }, [selectedClaimId]);

  const assignedExpert = useMemo(() => {
    if (!selectedClaim?.assignedExpertId) return null;
    return experts.find(e => e.id === selectedClaim.assignedExpertId) ?? null;
  }, [selectedClaim, experts]);

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

  const handleSelectClaim = (id: string) => {
    setSelectedClaimId(id);
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
      setNewStatus('Perit designat');
      toast({
        title: 'Perit assignat',
        description: `${expert.name} ha estat assignat al sinistre ${selectedClaim?.number}.`,
      });
    } catch {
      toast({ title: "Error en l'assignació", variant: 'destructive' });
    }
    setIsExpertDialogOpen(false);
  };

  const handleSaveStatus = async () => {
    if (!selectedClaimId) return;
    setSavingStatus(true);
    try {
      await updateClaimStatus(selectedClaimId, newStatus, noteText);
      setClaims(prev => prev.map(c =>
        c.id === selectedClaimId
          ? { ...c, status: newStatus, notes: noteText, updatedAt: new Date() }
          : c
      ));
      toast({ title: 'Sinistre actualitzat correctament' });
    } catch {
      toast({ title: "Error en l'actualització", variant: 'destructive' });
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[calc(100vh-120px)]">
      {/* Columna esquerra: llista */}
      <div className={cn("lg:col-span-5 space-y-3", selectedClaimId && "hidden lg:flex lg:flex-col")}>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cercar per número, títol o tipus..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v as ClaimStatus | 'Tots')}>
            <SelectTrigger className="h-9 text-xs w-full sm:w-40 flex-shrink-0">
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

        <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-border/60">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {filteredClaims.length} sinistres
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredClaims.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <FileText className="h-8 w-8 opacity-20" />
                <p className="text-xs">Cap sinistre trobat.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredClaims.map(claim => (
                  <button
                    key={claim.id}
                    onClick={() => handleSelectClaim(claim.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors hover:bg-muted/20 flex items-center justify-between gap-3",
                      selectedClaimId === claim.id && "bg-primary/5 hover:bg-primary/5"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-foreground">{claim.number}</p>
                        <ClaimStatusBadge status={claim.status} className="text-[10px] px-1.5 py-0" />
                      </div>
                      <p className="text-[11px] text-muted-foreground capitalize truncate">
                        {claim.title || claim.type}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {format(claim.createdAt, 'd MMM', { locale: ca })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Columna dreta: panell de detall */}
      <div className={cn("lg:col-span-7", !selectedClaimId && "hidden lg:flex lg:items-start")}>
        {selectedClaim ? (
          <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white w-full overflow-hidden sticky top-[73px] max-h-[calc(100vh-100px)] flex flex-col">
            {/* Capçalera del panell */}
            <div className="px-5 pt-4 pb-0 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3 lg:hidden">
                <Button variant="ghost" size="sm" onClick={() => setSelectedClaimId(null)} className="h-7 px-2 -ml-2">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Tornar
                </Button>
              </div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                    {selectedClaim.number}
                  </p>
                  <p className="text-sm font-bold capitalize text-foreground">
                    {selectedClaim.title || selectedClaim.type}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Creat el {format(selectedClaim.createdAt, "d 'de' MMMM yyyy", { locale: ca })}
                  </p>
                </div>
                <ClaimStatusBadge status={selectedClaim.status} />
              </div>
            </div>

            <CardContent className="p-0 flex flex-col flex-1 min-h-0">
              <Tabs defaultValue="declaracio" className="flex flex-col flex-1 min-h-0">
                <TabsList className="w-full rounded-none border-b border-t h-9 bg-transparent px-5 justify-start gap-4 flex-shrink-0">
                  <TabsTrigger value="declaracio" className="text-xs h-9 px-0 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                    Declaració
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

                {/* TAB: Declaració */}
                <TabsContent value="declaracio" className="flex-1 overflow-y-auto p-5 space-y-4 mt-0">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Descripció</p>
                    <p className="text-sm leading-relaxed text-foreground">{selectedClaim.description || 'Sense descripció.'}</p>
                  </div>

                  {selectedClaim.incidentAt && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Data del sinistre</p>
                      <p className="text-sm">{format(selectedClaim.incidentAt, "d 'de' MMMM yyyy", { locale: ca })}</p>
                    </div>
                  )}

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

                  {selectedClaim.report && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Informe del perit</p>
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{selectedClaim.report}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* TAB: Gestió */}
                <TabsContent value="gestio" className="flex-1 overflow-y-auto p-5 space-y-4 mt-0">
                  {/* Perit assignat */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Perit assignat</p>
                    {assignedExpert ? (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-[10px] flex-shrink-0">
                          {initials(assignedExpert.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-900">{assignedExpert.name}</p>
                          <p className="text-[10px] text-emerald-600">{assignedExpert.specialty} · {assignedExpert.zone}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mb-2">Cap perit assignat.</p>
                    )}
                    <Dialog open={isExpertDialogOpen} onOpenChange={setIsExpertDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full text-xs gap-2 h-9">
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>{assignedExpert ? 'Reassignar perit' : 'Assignar perit'}</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md w-[95vw] rounded-xl">
                        <DialogHeader>
                          <DialogTitle className="text-base font-semibold">Seleccionar perit</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto">
                          {experts.map((expert) => (
                            <div
                              key={expert.id}
                              className={cn(
                                "p-3 border rounded-xl hover:bg-muted/20 cursor-pointer transition-colors flex justify-between items-center group",
                                selectedClaim.assignedExpertId === expert.id && "border-emerald-500 bg-emerald-50/50"
                              )}
                              onClick={() => handleAssignExpert(expert)}
                            >
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

                  {/* Estat */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
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
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Notes internes <span className="normal-case font-normal">(no visibles al client)</span>
                    </p>
                    <Textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Afegeix notes de gestió interna..."
                      className="text-xs min-h-[80px] resize-none"
                    />
                  </div>

                  <Button
                    className="w-full text-xs h-9 font-semibold gap-2"
                    onClick={handleSaveStatus}
                    disabled={savingStatus}
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{savingStatus ? 'Desant...' : 'Desar canvis'}</span>
                  </Button>
                </TabsContent>

                {/* TAB: Chat */}
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
          <div className="w-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground bg-white rounded-2xl border border-dashed border-border p-12 text-center shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="bg-muted/50 p-5 rounded-2xl mb-4">
              <Search className="h-8 w-8 opacity-30" />
            </div>
            <p className="text-sm font-medium">Selecciona un sinistre per veure&apos;n els detalls.</p>
          </div>
        )}
      </div>
    </div>
  );
}
