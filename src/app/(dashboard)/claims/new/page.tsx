
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ClaimType } from '@/lib/types';
import { createClaim, uploadClaimPhoto } from '@/lib/db';
import { Camera, MapPin, ArrowLeft, ArrowRight, CheckCircle2, ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const CLAIM_TYPES: { type: ClaimType; label: string; icon: string }[] = [
  { type: 'RC', label: 'Resp. Civil', icon: '⚖️' },
  { type: 'meteorològic', label: 'Meteorològic', icon: '⛈️' },
  { type: 'maquinària', label: 'Maquinària', icon: '🚜' },
  { type: 'accident personal', label: 'Acc. Personal', icon: '🩹' },
  { type: 'ciberincident', label: 'Ciberincident', icon: '💻' },
  { type: 'altres', label: 'Altres', icon: '❓' },
];

export default function NewClaimPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]); // Fitxers reals per pujar
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]); // URLs temporals per la UI
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ClaimType | null>(null);
  const [description, setDescription] = useState('');
  const [incidentAt, setIncidentAt] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );
  const router = useRouter();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFiles(prev => [...prev, file]);
      setPhotoPreviews(prev => [...prev, URL.createObjectURL(file)]);
    }
  };

  const handleComplete = async () => {
    if (!selectedType) return;

    setIsUploading(true);

    try {
      const uploadedUrls = await Promise.all(
        photoFiles.map(file => uploadClaimPhoto(file))
      );

      await createClaim({
        type: selectedType,
        description: description,
        photos: uploadedUrls,
        incidentAt: new Date(incidentAt),
      });

      toast({
        title: "Sinistre declarat correctament",
        description: "El teu gestor obrirà el cas en menys de 2 hores.",
      });

      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast({
        title: "Error en la declaració",
        description: "Revisa la consola per a més detalls.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(step - 1) : router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">Declarar Sinistre</h2>
      </div>

      <div className="flex justify-between px-4">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1.5 w-[30%] rounded-full transition-colors",
              s <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-4">
            <Label className="text-lg font-bold">Quin tipus de sinistre és?</Label>
            <div className="grid grid-cols-2 gap-3">
              {CLAIM_TYPES.map((item) => (
                <button
                  key={item.type}
                  onClick={() => setSelectedType(item.type)}
                  className={cn(
                    "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                    selectedType === item.type
                      ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                      : "border-transparent bg-white hover:border-muted"
                  )}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-bold text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          <Button
            className="w-full h-12 text-lg font-bold"
            disabled={!selectedType}
            onClick={() => setStep(2)}
          >
            Continuar <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-4">
            <Label className="text-lg font-bold">Fotos i Descripció</Label>

            {/* SECCIÓ DE FOTOS: Ara aïllada en el seu propi contenidor horitzontal */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <input
                type="file"
                id="photo-upload"
                className="hidden"
                accept="image/*"
                multiple // Permet seleccionar més d'una si vols
                onChange={handleFileChange}
              />

              <label
                htmlFor="photo-upload"
                className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-muted flex flex-col items-center justify-center text-muted-foreground bg-white hover:bg-muted/10 cursor-pointer transition-colors"
              >
                <Camera className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-bold">AFEGIR</span>
              </label>

              {photoPreviews.map((url, idx) => (
                <div key={idx} className="relative w-24 h-24 flex-shrink-0">
                  <img
                    src={url}
                    alt={`Preview ${idx}`}
                    className="w-24 h-24 object-cover rounded-xl border shadow-sm"
                  />
                </div>
              ))}
            </div>

            {/* SECCIÓ DE DADES: Fora del flex de les fotos per anar cap avall */}
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="font-bold">Data i hora del sinistre</Label>
                <input
                  type="datetime-local"
                  value={incidentAt}
                  max={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setIncidentAt(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Què ha passat?</Label>
                <Textarea
                  placeholder="Descriu breument el sinistre..."
                  className="min-h-[120px] bg-white text-base"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {description.length}/1000 caràcters
                </p>
              </div>
            </div>
          </div>

          <Button
            className="w-full h-12 text-lg font-bold"
            disabled={!description || isUploading} // Evitem clicks si estem pujant
            onClick={() => setStep(3)}
          >
            {isUploading ? "Pujant..." : "Continuar"} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-4">
            <Label className="text-lg font-bold">Ubicació i Confirmació</Label>

            <Card className="bg-white overflow-hidden border-none shadow-sm">
              <div className="h-40 bg-muted flex items-center justify-center relative">
                <MapPin className="h-8 w-8 text-primary animate-bounce" />
                <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-[10px] font-bold">
                  Geolocalitzat: Forat 14 - Green
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Tipus</span>
                  <span className="text-sm font-bold text-primary">{selectedType}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Data/Hora</span>
                  <span className="text-sm font-bold">
                    {format(new Date(incidentAt), "d MMM yyyy HH:mm", { locale: ca })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-accent text-accent-foreground text-sm flex gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <p>El teu gestor rebrà la declaració a l'instant i obrirà el cas en menys de 2 hores.</p>
            </div>
          </div>
          <Button
            className="w-full h-14 text-xl font-bold shadow-lg shadow-primary/30"
            onClick={handleComplete}
          >
            Confirmar Declaració
          </Button>
        </div>
      )}
    </div>
  );
}
