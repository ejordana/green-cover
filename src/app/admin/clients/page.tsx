
"use client";

import { useState } from 'react';
import { mockClients } from '@/lib/mock-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, Filter, UserPlus, Mail, Phone, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function AdminClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = mockClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.managerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-primary p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-secondary" />
          <div>
            <h1 className="text-xl font-bold">GreenCover Back-office</h1>
            <p className="text-xs text-white/70">Gestió de Clients - Roger Jordana</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <nav className="flex gap-2 mr-4">
            <Link href="/admin">
              <Button variant="ghost" className="text-white hover:bg-white/10">Sinistres</Button>
            </Link>
            <Link href="/admin/clients">
              <Button variant="secondary" className="bg-secondary text-white">Clients</Button>
            </Link>
          </nav>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cercar camp o gerent..." 
              className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Camps de Golf Subscrits</h2>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" /> Nou Client
          </Button>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Camp de Golf</TableHead>
                  <TableHead>Gerent / Contacte</TableHead>
                  <TableHead>Ubicació</TableHead>
                  <TableHead>Nº Pòlissa</TableHead>
                  <TableHead>Sinistres Actius</TableHead>
                  <TableHead>Estat</TableHead>
                  <TableHead className="text-right">Accions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-bold">{client.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{client.managerName}</span>
                        <div className="flex gap-2 mt-1">
                          <button className="text-slate-400 hover:text-primary"><Mail className="h-3 w-3" /></button>
                          <button className="text-slate-400 hover:text-primary"><Phone className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{client.location}</TableCell>
                    <TableCell className="font-mono text-xs">{client.policyNumber}</TableCell>
                    <TableCell>
                      {client.activeClaimsCount > 0 ? (
                        <Badge variant="destructive" className="rounded-full px-2">
                          {client.activeClaimsCount} actius
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Cap pendent</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'Actiu' ? 'secondary' : 'outline'} className={
                        client.status === 'Actiu' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                        client.status === 'Pendent' ? 'bg-orange-100 text-orange-800 border-orange-200' : ''
                      }>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <ExternalLink className="h-3 w-3" /> Fitxa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
