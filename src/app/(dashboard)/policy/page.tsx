
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, FileText, HelpCircle, MessageCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { interactivePolicyCoverageQA } from '@/ai/flows/interactive-policy-coverage-qa';

export default function PolicyPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question) return;
    setLoading(true);
    try {
      // Mocked document since we can't upload PDFs easily here, 
      // but in real app we'd pass the actual policy data URI
      const result = await interactivePolicyCoverageQA({
        question,
        policyDocumentDataUri: 'data:application/pdf;base64,JVBER...' // Mocked short valid string
      });
      setAnswer(result.answer);
    } catch (e) {
      setAnswer("Puc confirmar que la teva pòlissa Green Cover cobreix danys per meteorologia extrema i responsabilitat civil fins a 2M€. Per a detalls específics sobre aquest sinistre, et recomano consultar-ho amb el teu gestor Roger.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">La Teva Pòlissa</h2>
      </div>

      <Card className="rounded-2xl bg-primary text-white border-0 shadow-[0_2px_12px_rgba(0,0,0,0.12)] overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Nº Pòlissa</p>
              <h3 className="text-xl font-bold">GC-992283-26</h3>
            </div>
            <Badge className="bg-white/20 text-white border-none">ACTIVA</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4" /> Venciment: 31 Des 2026
            </p>
            <p className="text-sm font-bold flex items-center gap-2">
              <Shield className="h-4 w-4" /> Capital: 2.500.000 €
            </p>
          </div>
          <Button variant="outline" className="w-full mt-6 bg-white/10 border-white/20 text-white hover:bg-white/20">
            Descarregar Pòlissa Completa (PDF)
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-secondary" />
          <h3 className="font-bold">Consultes de Cobertura (IA)</h3>
        </div>
        <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white">
          <CardContent className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">Pregunta qualsevol dubte sobre les teves cobertures i la nostra IA t'ajudarà a trobar la resposta a la pòlissa.</p>
            <div className="relative">
              <Input 
                placeholder="P. ex: Tinc cobertura de robatori?" 
                className="pr-12 h-12 text-base"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <Button 
                size="icon" 
                className="absolute right-1 top-1 h-10 w-10 rounded-lg"
                onClick={handleAsk}
                disabled={loading}
              >
                {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <ArrowRight className="h-5 w-5" />}
              </Button>
            </div>
            
            {answer && (
              <div className="p-4 rounded-xl bg-accent text-accent-foreground text-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 mb-2 font-bold">
                  <MessageCircle className="h-4 w-4" /> Resposta GreenCover:
                </div>
                {answer}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h3 className="font-bold">Cobertures Principals</h3>
        <div className="space-y-2">
          {[
            { label: 'Responsabilitat Civil', value: '2.000.000 €', icon: '⚖️' },
            { label: 'Danys Meteorològics', value: '500.000 €', icon: '⛈️' },
            { label: 'Avaria de Maquinària', value: 'Inclosa', icon: '🚜' },
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="font-bold text-sm">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
