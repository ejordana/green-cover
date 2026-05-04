"use client";

import { useEffect, useState } from 'react';
import { getExperts } from '@/lib/db';
import type { Expert } from '@/lib/types';
import { Shield, Star, ChevronRight, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default function PeritLandingPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExperts()
      .then(setExperts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a3d2b] via-[#1f4d35] to-[#2d6a46] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(80,160,100,0.15)_0%,_transparent_60%)]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="bg-white/10 border border-white/20 p-2.5 rounded-xl">
            <Shield className="h-5 w-5 text-emerald-300" />
          </div>
          <div>
            <span className="text-white font-semibold">GreenCover</span>
            <p className="text-white/50 text-xs">Portal de Perits</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Qui ets?</h1>
        <p className="text-white/50 text-sm mb-6">Selecciona el teu perfil per accedir als teus sinistres assignats.</p>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {experts.map((expert) => (
              <Link key={expert.id} href={`/perit/${expert.id}`}>
                <Card className="bg-white/10 border-white/15 hover:bg-white/15 transition-all cursor-pointer group">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold text-sm flex-shrink-0">
                      {expert.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{expert.name}</p>
                      <div className="flex items-center gap-2 text-white/50 text-xs">
                        <Briefcase className="h-3 w-3" />
                        <span>{expert.specialty}</span>
                        <span>·</span>
                        <span>{expert.zone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                          <Star className="h-3 w-3 fill-amber-400" /> {expert.rating}
                        </div>
                        <p className="text-white/40 text-[10px]">{expert.activeClaims} casos</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-[10px] text-white/30 font-medium uppercase tracking-widest">
          Green Cover Insurance · Portal Perits
        </p>
      </div>
    </div>
  );
}
