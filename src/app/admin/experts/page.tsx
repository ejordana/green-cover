
"use client";

import { useState, useEffect } from 'react';
import { createExpert, getExperts } from '@/lib/db';
import type { Expert } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UserPlus, Mail, Phone, Star, MapPin, Briefcase } from 'lucide-react';
import { PortalHeader } from '@/components/portal-header';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdminExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpertDialogOpen, setIsExpertDialogOpen] = useState(false);
  const [expertName, setExpertName] = useState('');
  const [expertSpecialty, setExpertSpecialty] = useState('');
  const [expertZone, setExpertZone] = useState('');
  const [expertPhone, setExpertPhone] = useState('');
  const [expertEmail, setExpertEmail] = useState('');
  const [expertRating, setExpertRating] = useState('4.5');
  const [isCreatingExpert, setIsCreatingExpert] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getExperts().then(setExperts).catch(console.error);
  }, []);

  const resetExpertForm = () => {
    setExpertName('');
    setExpertSpecialty('');
    setExpertZone('');
    setExpertPhone('');
    setExpertEmail('');
    setExpertRating('4.5');
  };

  const handleCreateExpert = async () => {
    if (!expertName.trim() || !expertSpecialty.trim() || !expertZone.trim()) {
      toast({ title: 'Falta informació', description: 'Introdueix nom, especialitat i zona.', variant: 'destructive' });
      return;
    }

    setIsCreatingExpert(true);
    try {
      const newExpert = await createExpert({
        name: expertName,
        specialty: expertSpecialty,
        zone: expertZone,
        phone: expertPhone,
        email: expertEmail,
        rating: Number(expertRating) || 0,
      });
      setExperts((current) => [newExpert, ...current]);
      toast({ title: 'Perit creat', description: `${newExpert.name} s'ha afegit correctament.` });
      setIsExpertDialogOpen(false);
      resetExpertForm();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No s’ha pogut crear el perit.', variant: 'destructive' });
    } finally {
      setIsCreatingExpert(false);
    }
  };

  const filteredExperts = experts.filter(expert =>
    expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expert.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PortalHeader
        title="Back-office"
        navItems={[
          { label: 'Sinistres', href: '/admin', active: false },
          { label: 'Clients', href: '/admin/clients', active: false },
          { label: 'Gestors', href: '/admin/managers', active: false },
          { label: 'Perits', href: '/admin/experts', active: true },
          { label: 'Usuaris', href: '/admin/users', active: false },
        ]}
        userName="Roger Jordana"
        userInitials="RJ"
        userSubtitle="Administrador"
      />

      <main className="p-4 md:p-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Perits Externs Homologats</h2>
          <Dialog open={isExpertDialogOpen} onOpenChange={(open) => {
            if (!open) resetExpertForm();
            setIsExpertDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-10 font-bold w-full sm:w-auto">
                <UserPlus className="h-4 w-4" /> Alta de Perit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-[95vw] rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Nou Perit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="expert-name" className="text-sm font-medium">Nom</Label>
                  <Input
                    id="expert-name"
                    value={expertName}
                    onChange={(e) => setExpertName(e.target.value)}
                    placeholder="Nom del perit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expert-specialty" className="text-sm font-medium">Especialitat</Label>
                  <Input
                    id="expert-specialty"
                    value={expertSpecialty}
                    onChange={(e) => setExpertSpecialty(e.target.value)}
                    placeholder="Especialitat"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expert-zone" className="text-sm font-medium">Zona</Label>
                  <Input
                    id="expert-zone"
                    value={expertZone}
                    onChange={(e) => setExpertZone(e.target.value)}
                    placeholder="Zona d’actuació"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="expert-phone" className="text-sm font-medium">Telèfon</Label>
                    <Input
                      id="expert-phone"
                      value={expertPhone}
                      onChange={(e) => setExpertPhone(e.target.value)}
                      placeholder="Telèfon"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expert-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="expert-email"
                      value={expertEmail}
                      onChange={(e) => setExpertEmail(e.target.value)}
                      placeholder="Email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expert-rating" className="text-sm font-medium">Ràting</Label>
                  <Input
                    id="expert-rating"
                    value={expertRating}
                    onChange={(e) => setExpertRating(e.target.value)}
                    placeholder="4.5"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsExpertDialogOpen(false)} className="h-10">Cancel·lar</Button>
                  <Button
                    onClick={handleCreateExpert}
                    disabled={isCreatingExpert}
                    className="h-10"
                  >
                    {isCreatingExpert ? 'Creant...' : 'Crear Perit'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="text-xs uppercase">Perit / Professional</TableHead>
                    <TableHead className="text-xs uppercase hidden sm:table-cell">Especialitat</TableHead>
                    <TableHead className="text-xs uppercase hidden lg:table-cell">Zona</TableHead>
                    <TableHead className="text-xs uppercase text-center">Ràting</TableHead>
                    <TableHead className="text-xs uppercase hidden md:table-cell">Càrrega</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExperts.map((expert) => (
                    <TableRow key={expert.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px] flex-shrink-0">
                            {expert.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex flex-col">
                            <span>{expert.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal sm:hidden">{expert.specialty}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Briefcase className="h-3 w-3" />
                          <span className="text-xs">{expert.specialty}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">{expert.zone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1 text-amber-500 font-bold text-xs">
                          <Star className="h-3 w-3 fill-amber-500" />
                          {expert.rating}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={expert.activeClaims > 1 ? 'destructive' : 'secondary'} className="rounded-full text-[10px] px-2 py-0">
                          {expert.activeClaims} casos
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                            <Phone className="h-3.5 w-3.5" />
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
      </main>
    </div>
  );
}
