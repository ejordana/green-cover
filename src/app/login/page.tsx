"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getProfileByAuth, getRoleByAuthId } from '@/lib/db';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEV_USERS = [
  { label: 'Admin',   email: 'ejordana@gmail.com',    password: 'GreenCover2025!', color: 'bg-slate-700 hover:bg-slate-600' },
  { label: 'Gestor',  email: 'gestor@greencover.cat', password: 'GreenCover2025!', color: 'bg-emerald-700 hover:bg-emerald-600' },
  { label: 'Perit',   email: 'perit@greencover.cat',  password: 'GreenCover2025!', color: 'bg-indigo-700 hover:bg-indigo-600' },
  { label: 'Can Prat',      email: 'can.prat@golf.cat',    password: 'GreenCover2025!', color: 'bg-teal-700 hover:bg-teal-600' },
  { label: 'Vallromanes',   email: 'vallromanes@golf.cat', password: 'GreenCover2025!', color: 'bg-teal-700 hover:bg-teal-600' },
  { label: 'La Garriga',    email: 'lagarriga@golf.cat',   password: 'GreenCover2025!', color: 'bg-teal-700 hover:bg-teal-600' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDev, setLoadingDev] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doLogin = async (e: string, p: string) => {
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: e, password: p });

    if (authError || !data.user) {
      setError('Credencials incorrectes. Comprova el teu email i contrasenya.');
      return;
    }

    let role = data.user.user_metadata?.role as string | undefined;
    let expertId: string | undefined;

    if (!role) {
      const profile = await getRoleByAuthId(data.user.id, data.user.email);
      if (!profile) {
        setError("Usuari no trobat a cap portal. Contacta amb l'administrador.");
        await supabase.auth.signOut();
        return;
      }
      role = profile.role;
      if (role === 'expert') expertId = profile.id;
    }

    if (role === 'expert') {
      if (!expertId) {
        const profile = await getProfileByAuth(data.user.id, 'expert');
        expertId = profile?.id;
      }
      router.replace(expertId ? `/perit/${expertId}` : '/perit');
    } else {
      const destinations: Record<string, string> = {
        client: '/dashboard', manager: '/gestor', admin: '/admin',
      };
      router.replace(destinations[role] ?? '/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    await doLogin(email, password);
    setLoading(false);
  };

  const handleDevLogin = async (user: typeof DEV_USERS[0]) => {
    setLoadingDev(user.email);
    setError(null);
    await doLogin(user.email, user.password);
    setLoadingDev(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a3d2b] via-[#1f4d35] to-[#2d6a46] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-2.5 rounded-xl">
            <Shield className="h-6 w-6 text-emerald-300" />
          </div>
          <span className="text-white/90 font-semibold text-lg tracking-wide">GreenCover</span>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl shadow-black/30">
          <h1 className="text-xl font-bold text-foreground mb-1">Benvingut</h1>
          <p className="text-sm text-muted-foreground mb-6">Accedeix amb el teu compte GreenCover</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correu electrònic</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contrasenya</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
              {loading
                ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Accedint...</span>
                : 'Accedir'}
            </Button>
          </form>

          {/* Accés ràpid dev */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Accés ràpid · dev</p>
            <div className="grid grid-cols-3 gap-2">
              {DEV_USERS.map(u => (
                <button
                  key={u.email}
                  onClick={() => handleDevLogin(u)}
                  disabled={!!loadingDev}
                  className={`${u.color} text-white text-xs font-semibold py-2 px-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1`}
                >
                  {loadingDev === u.email
                    ? <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-white/30 font-medium uppercase tracking-widest">
          Green Cover Insurance · Accés restringit
        </p>
      </div>
    </div>
  );
}
