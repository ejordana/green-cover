"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  getAdmins, getClients, getExperts, getManagers,
  createManagerWithAuth, createClientWithAuth, createExpertWithAuth, createAdminWithAuth,
  updateManager, updateExpert, updateClient, updateAdmin, deleteUser,
} from '@/lib/db';
import type { Admin, Client, Expert, Manager } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Pencil, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ── Types ────────────────────────────────────────────────────────────────────

type AppRole = 'Gestor' | 'Perit' | 'Client' | 'Admin';
type FilterRole = 'Tots' | AppRole;
type Entity = Manager | Expert | Client | Admin;

interface AppUser {
  id: string;
  name: string;
  role: AppRole;
  email: string;
  phone: string;
  extra: string;
  status: string;
  entity: Entity;
}

// ── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  role: AppRole;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  zone: string;
  policyNumber: string;
  status: 'Actiu' | 'Inactiu' | 'Pendent';
  available: boolean;
  rating: string;
  password: string;
  confirmPassword: string;
}

const emptyForm = (): FormState => ({
  role: 'Gestor', name: '', email: '', phone: '',
  specialty: '', zone: '', policyNumber: '',
  status: 'Actiu', available: true, rating: '4.5',
  password: '', confirmPassword: '',
});

function formFromEntity(role: AppRole, entity: Entity): FormState {
  const base = emptyForm();
  base.role = role;
  base.name = entity.name;
  if ('phone' in entity) base.phone = entity.phone ?? '';
  if ('email' in entity) base.email = (entity as any).email ?? '';
  if ('available' in entity) base.available = (entity as Manager).available;
  if ('specialty' in entity) base.specialty = (entity as Expert).specialty;
  if ('zone' in entity) base.zone = (entity as Expert).zone;
  if ('rating' in entity) base.rating = String((entity as Expert).rating);
  if ('policyNumber' in entity) base.policyNumber = (entity as Client).policyNumber;
  if ('status' in entity && typeof (entity as Client).status === 'string') {
    base.status = (entity as Client).status as 'Actiu' | 'Inactiu' | 'Pendent';
  }
  return base;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { toast } = useToast();

  const [admins,   setAdmins]   = useState<Admin[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [experts,  setExperts]  = useState<Expert[]>([]);
  const [clients,  setClients]  = useState<Client[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<FilterRole>('Tots');

  // Dialog state
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [form,         setForm]         = useState<FormState>(emptyForm());
  const [isSaving,     setIsSaving]     = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [isDeleting,   setIsDeleting]   = useState(false);

  useEffect(() => {
    getAdmins().then(setAdmins).catch(console.error);
    getManagers().then(setManagers).catch(console.error);
    getExperts().then(setExperts).catch(console.error);
    getClients().then(setClients).catch(console.error);
  }, []);

  const users = useMemo<AppUser[]>(() => [
    ...admins.map(e => ({
      id: e.id, name: e.name, role: 'Admin' as const,
      email: e.email, phone: e.phone,
      extra: 'Administrador de sistema',
      status: e.active ? 'Actiu' : 'Inactiu',
      entity: e,
    })),
    ...managers.map(e => ({
      id: e.id, name: e.name, role: 'Gestor' as const,
      email: '', phone: e.phone,
      extra: e.available ? 'Disponible' : 'No disponible',
      status: e.available ? 'Disponible' : 'No disponible',
      entity: e,
    })),
    ...experts.map(e => ({
      id: e.id, name: e.name, role: 'Perit' as const,
      email: e.email, phone: e.phone,
      extra: `${e.specialty} · ${e.zone}`,
      status: `Ràting ${e.rating.toFixed(1)}`,
      entity: e,
    })),
    ...clients.map(e => ({
      id: e.id, name: e.name, role: 'Client' as const,
      email: e.email, phone: e.phone,
      extra: `Pòlissa ${e.policyNumber}`,
      status: e.status,
      entity: e,
    })),
  ], [admins, managers, experts, clients]);

  const filtered = users.filter(u => {
    if (filterRole !== 'Tots' && u.role !== filterRole) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  // ── Helpers ──

  const field = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (user: AppUser) => {
    setEditingId(user.id);
    setForm(formFromEntity(user.role, user.entity));
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };

  // ── Save (create or edit) ──

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Falta el nom', variant: 'destructive' });
      return;
    }
    if (!editingId && (!form.email.trim() || !form.password)) {
      toast({ title: 'Falta email o contrasenya', variant: 'destructive' });
      return;
    }
    if (!editingId && form.password !== form.confirmPassword) {
      toast({ title: 'Les contrasenyes no coincideixen', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await handleUpdate(editingId, form);
      } else {
        await handleCreate(form);
      }
      closeDialog();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error desconegut', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async (f: FormState) => {
    if (f.role === 'Gestor') {
      const m = await createManagerWithAuth({ name: f.name, email: f.email, password: f.password, phone: f.phone, available: f.available });
      setManagers(p => [m, ...p]);
      toast({ title: 'Gestor creat' });
    } else if (f.role === 'Perit') {
      const e = await createExpertWithAuth({ name: f.name, email: f.email, password: f.password, specialty: f.specialty, zone: f.zone, phone: f.phone });
      setExperts(p => [e, ...p]);
      toast({ title: 'Perit creat' });
    } else if (f.role === 'Client') {
      const c = await createClientWithAuth({ name: f.name, email: f.email, password: f.password, phone: f.phone, policyNumber: f.policyNumber, status: f.status });
      setClients(p => [c, ...p]);
      toast({ title: 'Client creat' });
    } else {
      const a = await createAdminWithAuth({ name: f.name, email: f.email, password: f.password, phone: f.phone, active: f.available });
      setAdmins(p => [a, ...p]);
      toast({ title: 'Admin creat' });
    }
  };

  const handleUpdate = async (id: string, f: FormState) => {
    if (f.role === 'Gestor') {
      const m = await updateManager(id, { name: f.name, phone: f.phone, available: f.available });
      setManagers(p => p.map(x => x.id === id ? m : x));
    } else if (f.role === 'Perit') {
      const e = await updateExpert(id, { name: f.name, phone: f.phone, email: f.email, specialty: f.specialty, zone: f.zone, rating: Number(f.rating) || 0 });
      setExperts(p => p.map(x => x.id === id ? e : x));
    } else if (f.role === 'Client') {
      const c = await updateClient(id, { name: f.name, phone: f.phone, email: f.email, policy_number: f.policyNumber, status: f.status });
      setClients(p => p.map(x => x.id === id ? c : x));
    } else {
      const a = await updateAdmin(id, { name: f.name, phone: f.phone, email: f.email, active: f.available });
      setAdmins(p => p.map(x => x.id === id ? a : x));
    }
    toast({ title: 'Usuari actualitzat' });
  };

  // ── Delete ──

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const roleMap: Record<AppRole, 'manager' | 'expert' | 'client' | 'admin'> = {
        Gestor: 'manager', Perit: 'expert', Client: 'client', Admin: 'admin',
      };
      await deleteUser(deleteTarget.id, roleMap[deleteTarget.role]);
      if (deleteTarget.role === 'Gestor') setManagers(p => p.filter(x => x.id !== deleteTarget.id));
      if (deleteTarget.role === 'Perit')  setExperts(p  => p.filter(x => x.id !== deleteTarget.id));
      if (deleteTarget.role === 'Client') setClients(p  => p.filter(x => x.id !== deleteTarget.id));
      if (deleteTarget.role === 'Admin')  setAdmins(p   => p.filter(x => x.id !== deleteTarget.id));
      toast({ title: `${deleteTarget.name} eliminat` });
      setDeleteTarget(null);
    } catch (err) {
      toast({ title: 'Error eliminant', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const isEditing = editingId !== null;

  return (
    <div>
      {/* Capçalera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Usuaris de l&apos;aplicació</h2>
          <p className="text-sm text-slate-500">Gestiona gestors, perits, clients i admins.</p>
        </div>
        <Button className="gap-2 h-10 w-full sm:w-auto" onClick={openCreate}>
          <UserPlus className="h-4 w-4" /> Nou usuari
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nom, email o rol..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Select value={filterRole} onValueChange={v => setFilterRole(v as FilterRole)}>
          <SelectTrigger className="h-10 w-full sm:w-[160px]">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            {(['Tots', 'Gestor', 'Perit', 'Client', 'Admin'] as const).map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Taula */}
      <Card className="border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="text-xs uppercase">Nom</TableHead>
                  <TableHead className="text-xs uppercase">Rol</TableHead>
                  <TableHead className="text-xs uppercase hidden md:table-cell">Contacte</TableHead>
                  <TableHead className="text-xs uppercase hidden lg:table-cell">Detall</TableHead>
                  <TableHead className="text-xs uppercase">Estat</TableHead>
                  <TableHead className="text-right w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                      Cap usuari trobat.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(user => (
                  <TableRow key={`${user.role}-${user.id}`} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-sm">
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        {user.email && <span className="text-[10px] text-slate-400 font-normal">{user.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] px-2 py-0">{user.role}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-500">{user.phone || user.email || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-slate-500">{user.extra}</TableCell>
                    <TableCell className="text-xs text-slate-600">{user.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-primary"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-destructive"
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog crear / editar */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-lg w-[95vw] rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {isEditing ? `Editar ${form.role.toLowerCase()}` : 'Nou usuari'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Rol — només en creació */}
            {!isEditing && (
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as AppRole }))}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gestor">Gestor</SelectItem>
                    <SelectItem value="Perit">Perit</SelectItem>
                    <SelectItem value="Client">Client</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Camps comuns */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="f-name">Nom</Label>
                <Input id="f-name" value={form.name} onChange={field('name')} placeholder="Nom complet" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-phone">Telèfon</Label>
                <Input id="f-phone" value={form.phone} onChange={field('phone')} placeholder="Telèfon" />
              </div>
            </div>

            {/* Email — sempre visible (necessari per al compte d'autenticació) */}
            <div className="space-y-1.5">
              <Label htmlFor="f-email">Email</Label>
              <Input id="f-email" type="email" value={form.email} onChange={field('email')} placeholder="Email" disabled={isEditing} />
              {isEditing && <p className="text-[10px] text-muted-foreground">L&apos;email no es pot modificar</p>}
            </div>

            {/* Camps específics per rol */}
            {form.role === 'Perit' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="f-specialty">Especialitat</Label>
                  <Input id="f-specialty" value={form.specialty} onChange={field('specialty')} placeholder="Especialitat" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f-zone">Zona</Label>
                  <Input id="f-zone" value={form.zone} onChange={field('zone')} placeholder="Zona d'actuació" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f-rating">Ràting (0–5)</Label>
                  <Input id="f-rating" type="number" step="0.1" min="0" max="5" value={form.rating} onChange={field('rating')} />
                </div>
              </div>
            )}

            {form.role === 'Client' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="f-policy">Número de pòlissa</Label>
                  <Input id="f-policy" value={form.policyNumber} onChange={field('policyNumber')} placeholder="GC-XXXXXX-XX" />
                </div>
                <div className="space-y-1.5">
                  <Label>Estat</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as FormState['status'] }))}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actiu">Actiu</SelectItem>
                      <SelectItem value="Inactiu">Inactiu</SelectItem>
                      <SelectItem value="Pendent">Pendent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(form.role === 'Gestor' || form.role === 'Admin') && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-medium">{form.role === 'Gestor' ? 'Disponible' : 'Actiu'}</p>
                  <p className="text-xs text-slate-500">
                    {form.role === 'Gestor' ? 'Pot rebre nous casos' : 'Accés actiu al sistema'}
                  </p>
                </div>
                <Switch checked={form.available} onCheckedChange={v => setForm(f => ({ ...f, available: v }))} />
              </div>
            )}

            {/* Contrasenya — només en creació */}
            {!isEditing && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="f-pass">Contrasenya</Label>
                  <Input id="f-pass" type="password" value={form.password} onChange={field('password')} placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f-pass2">Confirmar</Label>
                  <Input id="f-pass2" type="password" value={form.confirmPassword} onChange={field('confirmPassword')} placeholder="••••••••" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog} className="h-10">Cancel·lar</Button>
              <Button onClick={handleSave} disabled={isSaving} className="h-10">
                {isSaving ? 'Desant...' : isEditing ? 'Desar canvis' : 'Crear usuari'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmació d'eliminació */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-xl w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuari</AlertDialogTitle>
            <AlertDialogDescription>
              Segur que vols eliminar <strong>{deleteTarget?.name}</strong>?
              Aquesta acció no es pot desfer i l&apos;usuari perdrà l&apos;accés immediatament.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel·lar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminant...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
