"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getExpertById, getClaimsByExpert, submitExpertReport } from '@/lib/db';
import type { Expert, Claim } from '@/lib/types';
import { ClaimStatusBadge } from '@/components/claim-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield, ArrowLeft, Camera, FileText, CheckCircle2, Clock,
  X, ImageIcon, Send, Paperclip, Download, FileArchive,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const DOC_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip';

function docIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['zip', 'rar', '7z'].includes(ext)) return <FileArchive className="h-4 w-4 text-amber-500 flex-shrink-0" />;
  return <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />;
}

export default function PeritDashboard() {
  const { expertId } = useParams<{ expertId: string }>();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);

  const [reportText, setReportText] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([getExpertById(expertId), getClaimsByExpert(expertId)])
      .then(([e, c]) => { setExpert(e); setClaims(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [expertId]);

  useEffect(() => {
    if (selectedClaim) {
      setReportText(selectedClaim.report ?? '');
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setDocFiles([]);
    }
  }, [selectedClaim?.id]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPhotoFiles(prev => [...prev, ...files]);
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setDocFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const removeDoc = (idx: number) => {
    setDocFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!selectedClaim || !reportText.trim()) return;
    setSubmitting(true);
    try {
      await submitExpertReport(selectedClaim.id, reportText, photoFiles, docFiles);
      const updated = { ...selectedClaim, report: reportText, status: 'Informe rebut' as const };
      setClaims(prev => prev.map(c => c.id === selectedClaim.id ? updated : c));
      setSelectedClaim(updated);
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setDocFiles([]);
      toast({ title: "Informe enviat correctament", description: "El gestor ha estat notificat." });
    } catch {
      toast({ title: "Error en l'enviament", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        Carregant...
      </div>
    );
  }

  const pendingClaims = claims.filter(c => c.status === 'Perit designat');
  const doneClaims = claims.filter(c => c.status !== 'Perit designat');
  const isSubmitted = selectedClaim?.status === 'Informe rebut';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white border-b border-border/60 sticky top-0 z-50">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto w-full px-4 md:px-6 py-3">
          <Link href="/perit" className="hover:opacity-80 transition-opacity flex items-center gap-2.5">
            <div className="bg-primary p-2 rounded-xl">
              <Shield className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary leading-tight">GreenCover</h1>
              <p className="text-[10px] text-muted-foreground font-medium leading-tight">Portal Perits</p>
            </div>
          </Link>
          {expert && (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {expert.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-tight">{expert.name}</p>
                <p className="text-[10px] text-muted-foreground">{expert.specialty}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Llista de sinistres */}
        <div className={cn("lg:col-span-4 space-y-4", selectedClaim && "hidden lg:block")}>
          {pendingClaims.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-orange-500" /> Pendent d'informe ({pendingClaims.length})
              </p>
              <div className="space-y-2">
                {pendingClaims.map(claim => (
                  <ClaimListItem key={claim.id} claim={claim}
                    isSelected={selectedClaim?.id === claim.id}
                    onClick={() => setSelectedClaim(claim)} />
                ))}
              </div>
            </div>
          )}
          {doneClaims.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Informats ({doneClaims.length})
              </p>
              <div className="space-y-2">
                {doneClaims.map(claim => (
                  <ClaimListItem key={claim.id} claim={claim}
                    isSelected={selectedClaim?.id === claim.id}
                    onClick={() => setSelectedClaim(claim)} />
                ))}
              </div>
            </div>
          )}
          {claims.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
              <FileText className="h-10 w-10 opacity-20 mb-3" />
              <p className="text-sm font-medium">No tens sinistres assignats.</p>
            </div>
          )}
        </div>

        {/* Panel detall + formulari */}
        <div className={cn("lg:col-span-8", !selectedClaim && "hidden lg:flex lg:items-center lg:justify-center")}>
          {selectedClaim ? (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" className="lg:hidden -ml-1 h-8" onClick={() => setSelectedClaim(null)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Tornar
              </Button>

              {/* Info sinistre */}
              <Card className="border border-border/60 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{selectedClaim.number}</p>
                      <h2 className="font-semibold text-base">{selectedClaim.description}</h2>
                    </div>
                    <ClaimStatusBadge status={selectedClaim.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground border-t pt-3">
                    <span><span className="font-semibold text-foreground capitalize">{selectedClaim.type}</span> · Tipus</span>
                    <span>
                      <span className="font-semibold text-foreground">
                        {format(selectedClaim.incidentAt ?? selectedClaim.createdAt, "d MMM yyyy", { locale: ca })}
                      </span> · Data sinistre
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Fotos del client */}
              {selectedClaim.photos.length > 0 && (
                <Card className="border border-border/60 shadow-sm bg-white">
                  <CardHeader className="py-3 px-4 border-b border-border/60">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      Fotografies del client ({selectedClaim.photos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedClaim.photos.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                          <img src={url} alt={`Foto client ${idx + 1}`}
                            className="w-24 h-24 object-cover rounded-xl border border-border/60 hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Formulari d'informe */}
              <Card className="border border-border/60 shadow-sm bg-white">
                <CardHeader className="py-3 px-4 border-b border-border/60">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Informe tècnic del perit
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-5">
                  {/* Text de l'informe */}
                  <Textarea
                    value={reportText}
                    onChange={e => setReportText(e.target.value)}
                    placeholder="Descriu les conclusions tècniques: causa del sinistre, danys observats, valoració econòmica estimada, recomanacions..."
                    className="min-h-[160px] text-sm resize-none"
                    disabled={isSubmitted}
                  />

                  {/* Fotografies */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Fotografies de l'informe
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {!isSubmitted && (
                        <>
                          <input ref={photoInputRef} type="file" accept="image/*" multiple
                            className="hidden" onChange={handlePhotoChange} />
                          <button onClick={() => photoInputRef.current?.click()}
                            className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-muted flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/20 transition-colors">
                            <Camera className="h-5 w-5 mb-1" />
                            <span className="text-[9px] font-semibold">AFEGIR</span>
                          </button>
                        </>
                      )}
                      {photoPreviews.map((url, idx) => (
                        <div key={idx} className="relative flex-shrink-0">
                          <img src={url} alt={`Nova foto ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-xl border border-border/60" />
                          <button onClick={() => removePhoto(idx)}
                            className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full h-5 w-5 flex items-center justify-center shadow">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {photoPreviews.length === 0 && isSubmitted && (
                        <p className="text-xs text-muted-foreground py-2">Sense fotografies adjuntes.</p>
                      )}
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Documents annexos
                    </p>

                    {/* Documents ja guardats */}
                    {selectedClaim.documents.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {selectedClaim.documents.map((doc, idx) => (
                          <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors group">
                            {docIcon(doc.name)}
                            <span className="text-xs font-medium flex-1 truncate">{doc.name}</span>
                            <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Nous documents pendents d'enviar */}
                    {docFiles.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {docFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-blue-200 bg-blue-50/50">
                            {docIcon(file.name)}
                            <span className="text-xs font-medium flex-1 truncate text-blue-900">{file.name}</span>
                            <span className="text-[10px] text-blue-500 mr-1">nou</span>
                            <button onClick={() => removeDoc(idx)}
                              className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {!isSubmitted && (
                      <>
                        <input ref={docInputRef} type="file" accept={DOC_ACCEPT} multiple
                          className="hidden" onChange={handleDocChange} />
                        <button onClick={() => docInputRef.current?.click()}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-muted text-muted-foreground hover:bg-muted/20 transition-colors text-xs font-medium w-full justify-center">
                          <Paperclip className="h-3.5 w-3.5" />
                          Annexar document (PDF, Word, Excel…)
                        </button>
                      </>
                    )}

                    {selectedClaim.documents.length === 0 && docFiles.length === 0 && isSubmitted && (
                      <p className="text-xs text-muted-foreground">Sense documents annexos.</p>
                    )}
                  </div>

                  {isSubmitted ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      Informe enviat. El gestor el revisarà aviat.
                    </div>
                  ) : (
                    <Button className="w-full gap-2 font-semibold"
                      disabled={!reportText.trim() || submitting}
                      onClick={handleSubmit}>
                      <Send className="h-4 w-4" />
                      {submitting ? 'Enviant...' : 'Enviar informe al gestor'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground text-center p-12">
              <div className="bg-muted/50 p-5 rounded-2xl mb-4">
                <FileText className="h-8 w-8 opacity-30" />
              </div>
              <p className="text-sm font-medium">Selecciona un sinistre per redactar l'informe.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ClaimListItem({ claim, isSelected, onClick }: { claim: Claim; isSelected: boolean; onClick: () => void }) {
  const isPending = claim.status === 'Perit designat';
  return (
    <button onClick={onClick} className={cn(
      "w-full text-left p-3.5 rounded-xl border transition-all",
      isSelected ? "border-primary/40 bg-primary/5" : "border-border/60 bg-white hover:bg-muted/20",
      isPending && !isSelected && "border-orange-200 bg-orange-50/50"
    )}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-xs font-bold text-foreground">{claim.number}</p>
        <ClaimStatusBadge status={claim.status} className="text-[9px] px-1.5 py-0 flex-shrink-0" />
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{claim.description}</p>
      <p className="text-[10px] text-muted-foreground capitalize font-medium">{claim.type}</p>
    </button>
  );
}
