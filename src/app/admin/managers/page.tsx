"use client";

import { useState, useEffect } from 'react';
import { createManager, getManagers } from '@/lib/db';
import type { Manager } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Search, UserPlus, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdminManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false);
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [managerPhotoUrl, setManagerPhotoUrl] = useState('https://picsum.photos/seed/manager/150/150');
  const [managerAvailable, setManagerAvailable] = useState(true);
  const [isCreatingManager, setIsCreatingManager] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getManagers().then(setManagers).catch(console.error);
  }, []);

  const resetManagerForm = () => {
    setManagerName('');
    setManagerPhone('');
    setManagerPhotoUrl('https://picsum.photos/seed/manager/150/150');
    setManagerAvailable(true);
  };

  const handleCreateManager = async () => {
    if (!managerName.trim() || !managerPhone.trim()) {
      toast({ title: 'Falta informació', description: 'Introdueix el nom i el telèfon del gestor.', variant: 'destructive' });
      return;
    }

    setIsCreatingManager(true);
    try {
      const newManager = await createManager({
        name: managerName,
        phone: managerPhone,
        photoUrl: managerPhotoUrl,
        available: managerAvailable,
      });
      setManagers((current) => [newManager, ...current]);
      toast({ title: 'Gestor creat', description: `${newManager.name} s'ha afegit correctament.` });
      setIsManagerDialogOpen(false);
      resetManagerForm();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No s’ha pogut crear el gestor.', variant: 'destructive' });
    } finally {
      setIsCreatingManager(false);
    }
  };

  const filteredManagers = managers.filter((manager) =>
    manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-primary p-4 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Shield className="h-8 w-8 text-secondary" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">GreenCover Back-office</h1>
              <p className="text-xs text-white/70">Gestió de Gestors - Roger Jordana</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <nav className="flex gap-1 bg-white/10 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8 text-xs">Sinistres</Button>
              </Link>
              <Link href="/admin/clients">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8 text-xs">Clients</Button>
              </Link>
              <Link href="/admin/managers">
                <Button variant="secondary" size="sm" className="bg-secondary text-white border-none h-8 text-xs">Gestors</Button>
              </Link>
              <Link href="/admin/experts">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8 text-xs">Perits</Button>
              </Link>
            </nav>
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-white/50" />
              <Input
                placeholder="Cercar gestor..."
                className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-8 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Gestors GreenCover</h2>
            <p className="text-sm text-slate-500">Configura qui atén i gestiona els sinistres dels clients.</p>
          </div>
          <Dialog open={isManagerDialogOpen} onOpenChange={(open) => {
            if (!open) resetManagerForm();
            setIsManagerDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-10 font-bold w-full sm:w-auto">
                <UserPlus className="h-4 w-4" /> Nou Gestor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-[95vw] rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Nou Gestor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="manager-name" className="text-sm font-medium">Nom</Label>
                  <Input
                    id="manager-name"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="Nom del gestor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager-phone" className="text-sm font-medium">Telèfon</Label>
                  <Input
                    id="manager-phone"
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    placeholder="Telèfon del gestor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager-photo" className="text-sm font-medium">URL de foto</Label>
                  <Input
                    id="manager-photo"
                    value={managerPhotoUrl}
                    onChange={(e) => setManagerPhotoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-slate-50 p-3">
                  <div>
                    <p className="text-sm font-medium">Disponible</p>
                    <p className="text-xs text-slate-500">Activa si el gestor pot rebre nous casos.</p>
                  </div>
                  <Switch checked={managerAvailable} onCheckedChange={(checked) => setManagerAvailable(Boolean(checked))} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsManagerDialogOpen(false)} className="h-10">Cancel·lar</Button>
                  <Button
                    onClick={handleCreateManager}
                    disabled={isCreatingManager}
                    className="h-10"
                  >
                    {isCreatingManager ? 'Creant...' : 'Crear Gestor'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="text-xs uppercase">Gestor</TableHead>
                    <TableHead className="text-xs uppercase hidden md:table-cell">Telèfon</TableHead>
                    <TableHead className="text-xs uppercase text-center">Disponibilitat</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredManagers.map((manager) => (
                    <TableRow key={manager.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100">
                            <img src={manager.photoUrl} alt={manager.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex flex-col">
                            <span>{manager.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal md:hidden">{manager.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-600">{manager.phone}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={manager.available ? 'secondary' : 'outline'} className="rounded-full py-0 text-[10px] px-2">
                          {manager.available ? 'Disponible' : 'No disponible'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
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
