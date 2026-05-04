
"use client";

import { useState } from 'react';
import { mockClients } from '@/lib/mock-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, UserPlus, Mail, Phone, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function AdminClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = mockClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.managerName.toLowerCase().includes(searchTerm.toLowerCase())
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
              <p className="text-xs text-white/70">Gestió de Clients - Roger Jordana</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <nav className="flex gap-1 bg-white/10 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8 text-xs">Sinistres</Button>
              </Link>
              <Link href="/admin/clients">
                <Button variant="secondary" size="sm" className="bg-secondary text-white border-none h-8 text-xs">Clients</Button>
              </Link>
              <Link href="/admin/experts">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8 text-xs">Perits</Button>
              </Link>
            </nav>
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-white/50" />
              <Input 
                placeholder="Cercar camp..." 
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
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Camps de Golf Subscrits</h2>
          <Button className="gap-2 h-10 font-bold w-full sm:w-auto">
            <UserPlus className="h-4 w-4" /> Nou Client
          </Button>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
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
