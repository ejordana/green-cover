
"use client";

import { useState, useEffect } from 'react';
import { getClients } from '@/lib/db';
import type { Client } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, Phone, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { PortalHeader } from '@/components/portal-header';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getClients().then(setClients).catch(console.error);
  }, []);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.managerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PortalHeader
        title="Back-office"
        navItems={[
          { label: 'Sinistres', href: '/admin', active: false },
          { label: 'Clients', href: '/admin/clients', active: true },
          { label: 'Gestors', href: '/admin/managers', active: false },
          { label: 'Perits', href: '/admin/experts', active: false },
          { label: 'Usuaris', href: '/admin/users', active: false },
        ]}
        userName="Roger Jordana"
        userInitials="RJ"
        userSubtitle="Administrador"
      />

      <main className="p-4 md:p-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Camps de Golf Subscrits</h2>
          <Button className="gap-2 h-10 font-bold w-full sm:w-auto">
            <UserPlus className="h-4 w-4" /> Nou Client
          </Button>
        </div>

        <Card className="border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="text-xs uppercase">Camp de Golf</TableHead>
                    <TableHead className="text-xs uppercase hidden md:table-cell">Gerent / Contacte</TableHead>
                    <TableHead className="text-xs uppercase hidden lg:table-cell">Pòlissa</TableHead>
                    <TableHead className="text-xs uppercase text-center">Sinistres</TableHead>
                    <TableHead className="text-xs uppercase">Estat</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-sm">
                        <div className="flex flex-col">
                          <span>{client.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal md:hidden">{client.managerName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{client.managerName}</span>
                          <div className="flex gap-1.5">
                            <button className="text-slate-300 hover:text-primary transition-colors"><Mail className="h-3 w-3" /></button>
                            <button className="text-slate-300 hover:text-primary transition-colors"><Phone className="h-3 w-3" /></button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-[10px] text-slate-500">{client.policyNumber}</TableCell>
                      <TableCell className="text-center">
                        {client.activeClaimsCount > 0 ? (
                          <Badge variant="destructive" className="rounded-full px-2 py-0 text-[10px]">
                            {client.activeClaimsCount}
                          </Badge>
                        ) : (
                          <span className="text-slate-300 text-[10px]">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.status === 'Actiu' ? 'secondary' : 'outline'} className={
                          client.status === 'Actiu' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] px-2 py-0' : 
                          'bg-orange-100 text-orange-800 border-orange-200 text-[10px] px-2 py-0'
                        }>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
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
