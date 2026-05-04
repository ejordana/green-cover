"use client";

import { useEffect, useMemo, useState } from 'react';
import { getAdmins, getClients, getExperts, getManagers, createManagerWithAuth, createClientWithAuth, createExpertWithAuth, createAdminWithAuth, updateClientStatus, updateManagerAvailability } from '@/lib/db';
import type { Admin, Client, Expert, Manager } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { PortalHeader } from '@/components/portal-header';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ROLE_OPTIONS = ['Tots', 'Gestor', 'Perit', 'Client', 'Admin'] as const;

type UserRole = (typeof ROLE_OPTIONS)[number];

type AppUser = {
  id: string;
  name: string;
  role: 'Gestor' | 'Perit' | 'Client' | 'Admin';
  contact: string;
  email: string;
  phone: string;
  extra: string;
  status: string;
  badge: 'secondary' | 'outline';
};

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole>('Tots');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<'Gestor' | 'Perit' | 'Client' | 'Admin'>('Gestor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [zone, setZone] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [status, setStatus] = useState<'Actiu' | 'Inactiu' | 'Pendent'>('Actiu');
  const [available, setAvailable] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getAdmins().then(setAdmins).catch(console.error);
    getManagers().then(setManagers).catch(console.error);
    getExperts().then(setExperts).catch(console.error);
    getClients().then(setClients).catch(console.error);
  }, []);

  const users = useMemo<AppUser[]>(() => {
    const managerUsers = managers.map((manager) => ({
      id: manager.id,
      name: manager.name,
      role: 'Gestor' as const,
      contact: manager.phone || '—',
      email: '',
      phone: manager.phone,
      extra: manager.available ? 'Disponible' : 'No disponible',
      status: manager.available ? 'Disponible' : 'No disponible',
      badge: 'secondary' as const,
    }));

    const expertUsers = experts.map((expert) => ({
      id: expert.id,
      name: expert.name,
      role: 'Perit' as const,
      contact: expert.email || expert.phone || '—',
      email: expert.email,
      phone: expert.phone,
      extra: `${expert.specialty} · ${expert.zone}`,
      status: `Ràting ${expert.rating.toFixed(1)}`,
      badge: 'outline' as const,
    }));

    const adminUsers = admins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      role: 'Admin' as const,
      contact: admin.email || admin.phone || '—',
      email: admin.email,
      phone: admin.phone,
      extra: 'Administrador de sistema',
      status: admin.active ? 'Actiu' : 'Inactiu',
      badge: admin.active ? 'secondary' : 'outline',
    }));

    const clientUsers = clients.map((client) => ({
      id: client.id,
      name: client.name,
      role: 'Client' as const,
      contact: client.email || client.phone || '—',
      email: client.email,
      phone: client.phone,
      extra: `Pòlissa ${client.policyNumber}`,
      status: client.status,
      badge: client.status === 'Actiu' ? 'secondary' : 'outline',
    }));

    return [...adminUsers, ...managerUsers, ...expertUsers, ...clientUsers] as AppUser[];
  }, [managers, experts, clients]);

  const filteredUsers = users.filter((user) => {
    if (filterRole !== 'Tots' && user.role !== filterRole) return false;
    if (!searchTerm.trim()) return true;
    const needle = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(needle) ||
      user.role.toLowerCase().includes(needle) ||
      user.contact.toLowerCase().includes(needle) ||
      user.extra.toLowerCase().includes(needle) ||
      user.status.toLowerCase().includes(needle)
    );
  });

  const resetForm = () => {
    setNewRole('Gestor');
    setName('');
    setEmail('');
    setPhone('');
    setSpecialty('');
    setZone('');
    setPolicyNumber('');
    setPassword('');
    setConfirmPassword('');
    setStatus('Actiu');
    setAvailable(true);
  };

  const handleCreateUser = async () => {
    if (!name.trim()) {
      toast({ title: 'Falta informació', description: 'Introdueix el nom de l’usuari.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      if (newRole === 'Gestor') {
        const manager = await createManagerWithAuth({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          available,
        });
        setManagers((current) => [manager, ...current]);
        toast({ title: 'Gestor creat', description: `${manager.name} ja pot gestionar sinistres.` });
      }

      if (newRole === 'Perit') {
        const expert = await createExpertWithAuth({
          name: name.trim(),
          email: email.trim(),
          password,
          specialty: specialty.trim(),
          zone: zone.trim(),
          phone: phone.trim(),
        });
        setExperts((current) => [expert, ...current]);
        toast({ title: 'Perit creat', description: `${expert.name} s'ha afegit a la xarxa de perits.` });
      }

      if (newRole === 'Client') {
        const client = await createClientWithAuth({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          policyNumber: policyNumber.trim(),
          status,
        });
        setClients((current) => [client, ...current]);
        toast({ title: 'Client creat', description: `${client.name} ja està disponible a la cartera.` });
      }

      if (newRole === 'Admin') {
        const admin = await createAdminWithAuth({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          active: available,
        });
        setAdmins((current) => [admin, ...current]);
        toast({ title: 'Administrador creat', description: `${admin.name} ja pot accedir a l’aplicació.` });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No s’ha pogut crear l’usuari.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAvailability = async (id: string, value: boolean) => {
    try {
      await updateManagerAvailability(id, value);
      setManagers((current) => current.map((manager) =>
        manager.id === id ? { ...manager, available: value } : manager
      ));
      toast({ title: 'Estat actualitzat', description: `Disponibilitat del gestor actualitzada.` });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No s’ha pogut actualitzar la disponibilitat.', variant: 'destructive' });
    }
  };

  const handleClientStatusChange = async (id: string, value: 'Actiu' | 'Inactiu' | 'Pendent') => {
    try {
      await updateClientStatus(id, value);
      setClients((current) => current.map((client) =>
        client.id === id ? { ...client, status: value } : client
      ));
      toast({ title: 'Estat actualitzat', description: `Estat del client actualitzat a ${value}.` });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No s’ha pogut actualitzar l’estat del client.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PortalHeader
        title="Back-office"
        navItems={[
          { label: 'Sinistres', href: '/admin', active: false },
          { label: 'Clients', href: '/admin/clients', active: false },
          { label: 'Gestors', href: '/admin/managers', active: false },
          { label: 'Perits', href: '/admin/experts', active: false },
          { label: 'Usuaris', href: '/admin/users', active: true },
        ]}
        userName="Roger Jordana"
        userInitials="RJ"
        userSubtitle="Administrador"
      />

      <main className="p-4 md:p-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Usuaris de l’aplicació</h2>
            <p className="text-sm text-slate-500">Gestiona els perfils de gestors, perits i clients des d’un sol lloc.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(160px,1fr)_auto] w-full lg:w-auto">
            <Input
              placeholder="Cerca per nom, rol o estat"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10"
            />
            <div className="flex items-center gap-2">
              <Select value={filterRole} onValueChange={(value) => setFilterRole(value as UserRole)}>
                <SelectTrigger className="h-10 min-w-[130px]">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (!open) resetForm();
              setIsDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 h-10 w-full sm:w-auto">
                  <UserPlus className="h-4 w-4" /> Nou usuari
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl w-[95vw] rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold">Nou usuari</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label className="text-sm font-medium">Rol</Label>
                    <Select value={newRole} onValueChange={(value) => setNewRole(value as 'Gestor' | 'Perit' | 'Client' | 'Admin')}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gestor">Gestor</SelectItem>
                        <SelectItem value="Perit">Perit</SelectItem>
                        <SelectItem value="Client">Client</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="user-name" className="text-sm font-medium">Nom</Label>
                      <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom complet" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-phone" className="text-sm font-medium">Telèfon</Label>
                      <Input id="user-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telèfon" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="user-email" className="text-sm font-medium">Email</Label>
                      <Input id="user-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
                    </div>
                    {newRole === 'Client' && (
                      <div className="space-y-2">
                        <Label htmlFor="policy-number" className="text-sm font-medium">Pòlissa</Label>
                        <Input id="policy-number" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} placeholder="Número de pòlissa" />
                      </div>
                    )}
                  </div>
                  {newRole === 'Perit' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="specialty" className="text-sm font-medium">Especialitat</Label>
                        <Input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Especialitat" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zone" className="text-sm font-medium">Zona</Label>
                        <Input id="zone" value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Zona d’actuació" />
                      </div>
                    </div>
                  )}                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">Contrasenya</Label>
                      <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contrasenya" type="password" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm font-medium">Confirma contrasenya</Label>
                      <Input id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirma contrasenya" type="password" required />
                    </div>
                  </div>                  {(newRole === 'Gestor' || newRole === 'Admin') && (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-slate-50 p-3">
                      <div>
                        <p className="text-sm font-medium">Actiu</p>
                        <p className="text-xs text-slate-500">
                          {newRole === 'Gestor'
                            ? 'Activa el gestor perquè pugui rebre nous casos.'
                            : 'Marca l’administrador com a actiu per fer-lo visible al sistema.'}
                        </p>
                      </div>
                      <Switch checked={available} onCheckedChange={(checked) => setAvailable(Boolean(checked))} />
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-10">Cancel·lar</Button>
                    <Button onClick={handleCreateUser} disabled={isSaving} className="h-10">
                      {isSaving ? 'Guardant...' : 'Crear usuari'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="text-xs uppercase">Usuari</TableHead>
                    <TableHead className="text-xs uppercase hidden sm:table-cell">Rol</TableHead>
                    <TableHead className="text-xs uppercase hidden md:table-cell">Contacte</TableHead>
                    <TableHead className="text-xs uppercase">Detall</TableHead>
                    <TableHead className="text-xs uppercase">Estat</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={`${user.role}-${user.id}`} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-sm">
                        <div className="flex flex-col gap-1">
                          <span>{user.name}</span>
                          <span className="text-[10px] text-slate-400">{user.contact}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        <Badge variant={user.badge}>{user.role}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-600">{user.contact}</TableCell>
                      <TableCell className="text-sm text-slate-600">{user.extra}</TableCell>
                      <TableCell className="text-sm text-slate-600">{user.status}</TableCell>
                      <TableCell className="text-right">
                        {user.role === 'Gestor' ? (
                          <Switch
                            checked={user.status === 'Disponible'}
                            onCheckedChange={(checked) => handleToggleAvailability(user.id, Boolean(checked))}
                          />
                        ) : user.role === 'Client' ? (
                          <Select value={user.status as 'Actiu' | 'Inactiu' | 'Pendent'} onValueChange={(value) => handleClientStatusChange(user.id, value as 'Actiu' | 'Inactiu' | 'Pendent')}>
                            <SelectTrigger className="h-9 min-w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Actiu">Actiu</SelectItem>
                              <SelectItem value="Inactiu">Inactiu</SelectItem>
                              <SelectItem value="Pendent">Pendent</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : user.role === 'Admin' ? (
                          <Badge variant="secondary">Admin</Badge>
                        ) : (
                          <Badge variant="outline">Ràting</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
