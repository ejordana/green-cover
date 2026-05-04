
"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ClaimType } from '@/lib/types';
import { createClaim, uploadClaimPhoto } from '@/lib/db';
import { Camera, ArrowLeft, ArrowRight, CheckCircle2, ImageIcon, Mic, MicOff } from 'lucide-react';
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentAt, setIncidentAt] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [latitude, setLatitude] = useState(41.3851);
  const [longitude, setLongitude] = useState(2.1734);
  const [locationName, setLocationName] = useState('Forat 14 - Green');
  const [isGeolocating, setIsGeolocating] = useState(false);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ca-ES';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setDescription(prev => prev + transcript);
      };
      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.onerror = () => setIsRecording(false);
      setSpeechSupported(true);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleGetLocation = async () => {
    setIsGeolocating(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude: lat, longitude: lng } = position.coords;
            setLatitude(lat);
            setLongitude(lng);
            setLocationName('La meva ubicació actual');
            toast({
              title: 'Ubicació detectada',
              description: `Coordenades: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
            });
            setIsGeolocating(false);
          },
          (error) => {
            console.error(error);
            toast({
              title: "No s'ha pogut accedir a la ubicació",
              description: "Permet l'accés a la geolocalització en la configuració del navegador.",
              variant: 'destructive',
            });
            setIsGeolocating(false);
          }
        );
      } else {
        toast({
          title: 'Geolocalització no disponible',
          description: 'El teu navegador no admet geolocalització.',
          variant: 'destructive',
        });
        setIsGeolocating(false);
      }
    } catch (error) {
      console.error(error);
      setIsGeolocating(false);
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Map pixel position to coordinates (Barcelona area)
    // bbox=2.0634,41.3251,2.2834,41.4451
    const minLng = 2.0634;
    const maxLng = 2.2834;
    const minLat = 41.3251;
    const maxLat = 41.4451;
    
    const newLng = minLng + (x * (maxLng - minLng));
    const newLat = maxLat - (y * (maxLat - minLat));
    
    setLatitude(newLat);
    setLongitude(newLng);
    setLocationName('Ubicació personalitzada');
  };

  const mapSrcUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.01}%2C${longitude + 0.01}%2C${latitude + 0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`;

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
        title: title,
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
                <Label className="font-bold">Títol breu</Label>
                <Input
                  placeholder="Ex: Granissada al camp nord"
                  maxLength={80}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white"
                />
              </div>
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
                <div className="flex items-center justify-between gap-3">
                  <Label className="font-bold">Què ha passat?</Label>
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition',
                        isRecording
                          ? 'border-destructive bg-destructive text-white'
                          : 'border-muted bg-white text-muted-foreground hover:border-foreground hover:text-foreground'
                      )}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="h-4 w-4" />
                          Parar
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          Dictar
                        </>
                      )}
                    </button>
                  )}
                </div>
                <Textarea
                  placeholder="Descriu breument el sinistre..."
                  className="min-h-[120px] bg-white text-base"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{description.length}/1000 caràcters</span>
                  {speechSupported ? (
                    <span>{isRecording ? 'Escoltant els teus comentaris…' : 'Prem Dictar per parlar en lloc d’escriure.'}</span>
                  ) : (
                    <span className="text-slate-400">El teu navegador no admet dictat directe.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button
            className="w-full h-12 text-lg font-bold"
            disabled={!title || !description || isUploading} // Evitem clicks si estem pujant
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

            {/* Geolocation Controls */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="text-sm font-semibold text-slate-900">Ajusta la ubicació del sinistre</p>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Latitud</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    className="w-full px-2 py-1 text-sm rounded-md border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Longitud</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    className="w-full px-2 py-1 text-sm rounded-md border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={handleGetLocation}
                disabled={isGeolocating}
              >
                {isGeolocating ? 'Detectant ubicació...' : '📍 Usar la meva ubicació'}
              </Button>

              <p className="text-xs text-slate-600">
                💡 Pots editar les coordenades manualment o fer clic al mapa per seleccionar la ubicació.
              </p>
            </div>

            <Card className="bg-white overflow-hidden border-none shadow-sm">
              <div 
                className="relative h-72 w-full cursor-crosshair"
                onClick={handleMapClick}
                title="Fes clic per seleccionar la ubicació del sinistre"
              >
                <iframe
                  src={mapSrcUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 'none', pointerEvents: 'none' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicació del sinistre"
                />
                
                {/* Location badge overlay */}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md z-10 pointer-events-none">
                  <p className="text-[11px] font-semibold text-emerald-700">✓ {locationName}</p>
                  <p className="text-[10px] text-slate-600">{latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E</p>
                </div>

                {/* Instruction overlay for mobile */}
                <div className="absolute bottom-3 right-3 bg-slate-900/80 text-white px-2 py-1.5 rounded-lg text-[10px] pointer-events-none">
                  Fes clic per ajustar
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Ubicació</span>
                  <span className="text-sm font-bold text-primary">{locationName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Coordenades</span>
                  <span className="text-sm font-mono text-slate-700">{latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Tipus</span>
                  <span className="text-sm font-bold text-primary">{selectedType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Data/Hora</span>
                  <span className="text-sm font-bold">
                    {format(new Date(incidentAt), "d MMM yyyy HH:mm", { locale: ca })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-accent text-accent-foreground text-sm flex gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <p>El teu gestor rebrà la declaració i obrirà el cas en menys de 2 hores.</p>
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
