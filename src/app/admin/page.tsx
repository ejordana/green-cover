
"use client";

import { useState } from 'react';
import { mockClaims } from '@/lib/mock-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ClaimStatusBadge } from '@/components/claim-status-badge';
import { Shield, Search, Filter, BrainCircuit, ExternalLink, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { aiClaimInitialAssessment } from '@/ai/flows/ai-claim-initial-assessment';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';

export default function AdminBackOffice() {
  const [selectedClaim, setSelectedClaim] = useState<typeof mockClaims[0] | null>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-primary p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-secondary" />
          <div>
            <h1 className="text-xl font-bold">GreenCover Back-office</h1>
            <p className="text-xs text-white/70">Gestió de Sinistres - Roger Jordana</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Cercar sinistre o camp..." className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-9" />
          </div>
          <Button variant="secondary" size="sm">Configuració</Button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sinistres Assignats</CardTitle>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" /> Filtres
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referència</TableHead>
                    <TableHead>Client / Camp</TableHead>
                    <TableHead>Tipus</TableHead>
                    <TableHead>Estat</TableHead>
                    <TableHead>Darrera Actualització</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockClaims.map((claim) => (
                    <TableRow key={claim.id} className="cursor-pointer hover:bg-slate-50" onClick={() => { setSelectedClaim(claim); setAssessment(null); }}>
                      <TableCell className="font-bold">{claim.number}</TableCell>
                      <TableCell>Real Club Golf El Prat</TableCell>
                      <TableCell className="capitalize">{claim.type}</TableCell>
                      <TableCell><ClaimStatusBadge status={claim.status} /></TableCell>
                      <TableCell className="text-slate-500">{format(claim.updatedAt, 'dd/MM/yyyy HH:mm', { locale: ca })}</TableCell>
                      <TableCell><ExternalLink className="h-4 w-4 text-slate-400" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-4 space-y-6">
          {selectedClaim ? (
            <Card className="border-none shadow-sm border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Detall Sinistre
                  <span className="text-xs font-normal text-slate-500">{selectedClaim.number}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Descripció del Client</label>
                  <p className="text-sm mt-1">{selectedClaim.description}</p>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-100 text-orange-800 text-xs font-bold">
                  <Clock className="h-4 w-4" /> SLA: Resten 14 hores per complir les 72h.
                </div>

                <div className="space-y-2">
                  <Button 
                    className="w-full gap-2 bg-secondary hover:bg-secondary/90" 
                    onClick={() => handleAIAnalyze(selectedClaim)}
                    disabled={loading}
                  >
                    <BrainCircuit className="h-4 w-4" /> 
                    {loading ? 'Analitzant...' : 'Avaluació IA Inicial'}
                  </Button>
                </div>

                {assessment && (
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-sm space-y-3 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-2 font-bold text-emerald-400">
                      <BrainCircuit className="h-4 w-4" /> Resultat IA
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500">Resum de Danys</p>
                      <p className="text-xs leading-relaxed">{assessment.damageSummary}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500">Categories Suggerides</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px]">{assessment.suggestedClaimCategory}</Badge>
                        {assessment.keyEntities.map((ent: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-slate-400 border-slate-700 text-[10px]">{ent}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t space-y-2">
                  <Button variant="outline" className="w-full text-xs">Assignar Perit Extern</Button>
                  <Button className="w-full text-xs">Actualitzar Estat</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border-dashed border-2 p-12 text-center">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p>Selecciona un sinistre per veure’n els detalls i realitzar l’avaluació IA.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
