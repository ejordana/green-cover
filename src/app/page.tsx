
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a3d2b] via-[#1f4d35] to-[#2d6a46] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(80,160,100,0.15)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,0,0,0.2)_0%,_transparent_60%)]" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-2.5 rounded-xl">
            <Shield className="h-6 w-6 text-emerald-300" />
          </div>
          <span className="text-white/90 font-semibold text-lg tracking-wide">GreenCover</span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-3 leading-tight tracking-tight">
          Gestió de sinistres sense friccions
        </h1>
        <p className="text-base text-white/60 mb-10 leading-relaxed">
          La plataforma exclusiva per a camps de golf de referència. Declara, segueix i resol en temps real.
        </p>

        <div className="flex flex-col gap-2 mb-8 text-left w-full">
          {['Resolució garantida en 72h', 'Avaluació IA instantània', 'Comunicació directa amb perits'].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-sm text-white/70">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>

        <div className="space-y-3 w-full">
          <Link href="/dashboard" className="w-full block">
            <Button className="w-full h-12 text-sm font-semibold rounded-xl bg-white text-primary hover:bg-white/90 shadow-lg shadow-black/20 transition-all">
              Accés Gerent <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/admin" className="w-full block">
            <Button variant="outline" className="w-full h-12 text-sm font-semibold rounded-xl border border-white/20 text-white/80 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all">
              Back-office Gestors
            </Button>
          </Link>
          <Link href="/perit" className="w-full block">
            <Button variant="outline" className="w-full h-12 text-sm font-semibold rounded-xl border border-white/10 text-white/50 bg-transparent hover:bg-white/5 backdrop-blur-sm transition-all">
              Portal Perits
            </Button>
          </Link>
        </div>

        <p className="mt-10 text-[10px] text-white/30 font-medium uppercase tracking-widest">
          Green Cover Insurance · v1.0
        </p>
      </div>
    </div>
  );
}
