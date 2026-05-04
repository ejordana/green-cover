
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#EEF3F0] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-primary p-4 rounded-3xl shadow-2xl mb-8">
        <Shield className="h-16 w-16 text-secondary" />
      </div>
      <h1 className="text-4xl font-bold text-primary mb-4 tracking-tight">GreenCover Connect</h1>
      <p className="text-lg text-muted-foreground mb-12 max-w-sm">
        La plataforma exclusiva de gestió de sinistres per a camps de golf de referència.
      </p>
      
      <div className="space-y-4 w-full max-w-xs">
        <Link href="/dashboard" className="w-full block">
          <Button className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20">
            Accés Gerent <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <Link href="/admin" className="w-full block">
          <Button variant="outline" className="w-full h-14 text-lg font-bold rounded-2xl border-2 hover:bg-white transition-all">
            Back-office Gestors
          </Button>
        </Link>
      </div>
      
      <p className="mt-12 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
        Versió 1.0  ·  Green Cover Insurance
      </p>
    </div>
  );
}
