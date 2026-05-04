
"use client";

import { useState } from 'react';
import { mockExperts } from '@/lib/mock-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, UserPlus, Mail, Phone, Star, MapPin, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function AdminExpertsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExperts = mockExperts.filter(expert => 
    expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expert.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-primary p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-secondary" />
          <div>
            <h1 className="text-xl font-bold">GreenCover Back-office</h1>
            <p className="text-xs text-white/70">Xarxa de Perits - Roger Jordana</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <nav className="flex gap-2 mr-4">
            <Link href="/admin">
              <Button variant="ghost" className="text-white hover:bg-white/10">Sinistres</Button>
            </Link>
            <Link href="/admin/clients">
              <Button variant="ghost" className="text-white hover:bg-white/10">Clients</Button>
            </Link>
            <Link href="/admin/experts">
              <Button variant="secondary" className="bg-secondary text-white">Perits</Button>
            </Link>
          </nav>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cercar perit o especialitat..." 
              className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Perits Externs Homologats</h2>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" /> Alta de Perit
          </Button>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Perit / Professional</TableHead>
                  <TableHead>Especialitat</TableHead>
                  <TableHead>Zona d'Actuació</TableHead>
                  <TableHead>Ràting</TableHead>
                  <TableHead>Càrrega de Treball</TableHead>
                  <TableHead>Contacte</TableHead>
                  <TableHead className="text-right">Accions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExperts.map((expert) => (
                  <TableRow key={expert.id}>
                    <TableCell className="font-bold">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                          {expert.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        {expert.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3 w-3 text-slate-400" />
                        <span className="text-sm">{expert.specialty}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="text-sm text-slate-600">{expert.zone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                        {expert.rating}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={expert.activeClaims > 1 ? 'destructive' : 'secondary'} className="rounded-full">
                        {expert.activeClaims} casos actius
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3">
                        <button className="text-slate-400 hover:text-primary"><Mail className="h-4 w-4" /></button>
                        <button className="text-slate-400 hover:text-primary"><Phone className="h-4 w-4" /></button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Historial</Button>
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
