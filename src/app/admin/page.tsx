
"use client";

import { useState } from 'react';
import { mockClaims, mockExperts } from '@/lib/mock-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ClaimStatusBadge } from '@/components/claim-status-badge';
import { Shield, Search, Filter, BrainCircuit, ExternalLink, Clock, UserCheck, Star, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { aiClaimInitialAssessment } from '@/ai/flows/ai-claim-initial-assessment';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function AdminBackOffice() {
  const [selectedClaim, setSelectedClaim] = useState<typeof mockClaims[0] | null>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isExpertDialogOpen, setIsExpertDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAIAnalyze = async (claim: typeof mockClaims[0]) => {
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

  const handleAssignExpert = (expert: typeof mockExperts[0]) => {
    toast({
      title: "Perit assignat",
      description: `${expert.name} ha estat assignat al sinistre ${selectedClaim?.number}.`,
    });
    setIsExpertDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-primary p-4 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Shield className="h-8 w-8 text-secondary" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">GreenCover Back-office</h1>
              <p className="text-xs text-white/70">Gestió de Sinistres - Roger Jordana</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <nav className="flex gap-1 bg-white/10 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
              <Link href="/admin">
                <Button variant="secondary" size="sm" className="bg-secondary text-white border-none h-8 text-xs">Sinistres</Button>
              </Link>
              <Link href="/admin/clients">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8 text-xs">Clients</Button>
              </Link>
              <Link href="/admin/experts">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8 text-xs">Perits</Button>
              </Link>
            </nav>
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-white/50" />
              <Input placeholder="Cercar..." className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-8 text-xs" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={cn("lg:col-span-8 space-y-6", selectedClaim && "hidden lg:block")}>
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg">Sinistres Pendent</CardTitle>
              <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                <Filter className="h-3 w-3" /> Filtres
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="text-xs uppercase">Referència</TableHead>
                      <TableHead className="text-xs uppercase">Client</TableHead>
                      <TableHead className="text-xs uppercase hidden sm:table-cell">Tipus</TableHead>
                      <TableHead className="text-xs uppercase">Estat</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockClaims.map((claim) => (
                      <TableRow 
                        key={claim.id} 
                        className="cursor-pointer hover:bg-slate-50 transition-colors" 
                        onClick={() => { setSelectedClaim(claim); setAssessment(null); }}
                      >
                        <TableCell className="font-bold text-xs">{claim.number}</TableCell>
                        <TableCell className="text-xs">Real Club Golf El Prat</TableCell>
                        <TableCell className="capitalize text-xs hidden sm:table-cell">{claim.type}</TableCell>
                        <TableCell><ClaimStatusBadge status={claim.status} className="text-[10px] px-2 py-0" /></TableCell>
                        <TableCell className="text-right">
                          <ExternalLink className="h-3 w-3 text-slate-400 inline" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={cn("lg:col-span-4", !selectedClaim && "hidden lg:block")}>
          {selectedClaim ? (
            <Card className="border-none shadow-sm border-l-4 border-l-primary sticky top-6">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2 lg:hidden">
                   <Button variant="ghost" size="sm" onClick={() => setSelectedClaim(null)} className="h-8 px-2 -ml-2">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Tornar
                   </Button>
                </div>
                <CardTitle className="flex items-center justify-between text-base">
                  Detall del Cas
                  <span className="text-xs font-normal text-slate-500">{selectedClaim.number}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripció del Client</label>
                  <p className="text-sm mt-1 leading-relaxed">{selectedClaim.description}</p>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-100 text-orange-800 text-[11px] font-bold">
                  <Clock className="h-4 w-4 flex-shrink-0" /> SLA: Resten 14 hores per complir les 72h.
                </div>

                <div className="pt-2">
                  <Button 
                    className="w-full gap-2 bg-secondary hover:bg-secondary/90 h-10 text-xs font-bold" 
                    onClick={() => handleAIAnalyze(selectedClaim)}
                    disabled={loading}
                  >
                    <BrainCircuit className="h-4 w-4" /> 
                    {loading ? 'Analitzant...' : 'Avaluació IA Inicial'}
                  </Button>
                </div>

                {assessment && (
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 font-bold text-emerald-400">
                      <BrainCircuit className="h-4 w-4" /> Resultat IA
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Resum de Danys</p>
                      <p className="text-xs leading-relaxed text-slate-300">{assessment.damageSummary}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Categories Suggerides</p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[9px] px-2 py-0">{assessment.suggestedClaimCategory}</Badge>
                        {assessment.keyEntities.map((ent: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-slate-400 border-slate-700 text-[9px] px-2 py-0">{ent}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t space-y-2">
                  <Dialog open={isExpertDialogOpen} onOpenChange={setIsExpertDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full text-xs gap-2 h-10">
                        <UserCheck className="h-3.5 w-3.5" /> Assignar Perit Extern
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md w-[95vw] rounded-xl">
                      <DialogHeader>
                        <DialogTitle className="text-lg">Seleccionar Perit</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto">
                        {mockExperts.map((expert) => (
                          <div 
                            key={expert.id} 
                            className="p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center group"
                            onClick={() => handleAssignExpert(expert)}
                          >
                            <div className="space-y-1">
                              <p className="font-bold text-sm group-hover:text-primary">{expert.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <Badge variant="outline" className="text-[9px] py-0 px-1.5">{expert.specialty}</Badge>
                                <span className="hidden sm:inline">{expert.zone}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                                <Star className="h-3 w-3 fill-amber-500" /> {expert.rating}
                              </div>
                              <p className="text-[10px] text-slate-400">{expert.activeClaims} casos</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button className="w-full text-xs h-10 font-bold">Actualitzar Estat</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border-dashed border-2 p-12 text-center">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <Search className="h-10 w-10 opacity-20" />
              </div>
              <p className="text-sm font-medium">Selecciona un sinistre per veure’n els detalls i realitzar l’avaluació IA.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
