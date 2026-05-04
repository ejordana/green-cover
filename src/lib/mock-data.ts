
import { Claim, Manager, Client, Expert } from './types';

export const mockManager: Manager = {
  id: 'm1',
  name: 'Roger Jordana',
  photoUrl: 'https://picsum.photos/seed/manager/150/150',
  phone: '+34 600 000 000',
  available: true,
};

export const mockExperts: Expert[] = [
  {
    id: 'e1',
    name: 'Carles Agrònom',
    specialty: 'Agronomia i Gespa',
    zone: 'Catalunya Central',
    phone: '611 222 333',
    email: 'carles.perit@expertgolf.cat',
    rating: 4.8,
    activeClaims: 2
  },
  {
    id: 'e2',
    name: 'Laura Mecànica',
    specialty: 'Maquinària Industrial',
    zone: 'Barcelona / Maresme',
    phone: '622 333 444',
    email: 'laura.m@peritatges.cat',
    rating: 4.9,
    activeClaims: 1
  },
  {
    id: 'e3',
    name: 'Jordi Civil',
    specialty: 'Resp. Civil i Danys',
    zone: 'Tarragona / Lleida',
    phone: '633 444 555',
    email: 'jordi.civil@assegurances.cat',
    rating: 4.5,
    activeClaims: 0
  }
];

export const mockClients: Client[] = [
  {
    id: 'c1',
    name: 'Real Club de Golf El Prat',
    location: 'Terrassa, Barcelona',
    managerName: 'Joan Vila',
    email: 'j.vila@rcgelprat.com',
    phone: '937 28 10 00',
    policyNumber: 'GC-992283-26',
    activeClaimsCount: 2,
    status: 'Actiu'
  },
  {
    id: 'c2',
    name: 'PGA Catalunya Golf and Wellness',
    location: 'Caldes de Malavella, Girona',
    managerName: 'Marta Soler',
    email: 'm.soler@pgacatalunya.com',
    phone: '972 47 22 49',
    policyNumber: 'GC-881122-25',
    activeClaimsCount: 0,
    status: 'Actiu'
  },
  {
    id: 'c3',
    name: 'Golf Montanyà',
    location: 'El Brull, Barcelona',
    managerName: 'Pere Roura',
    email: 'p.roura@golfmontanya.com',
    phone: '938 84 01 70',
    policyNumber: 'GC-773344-24',
    activeClaimsCount: 1,
    status: 'Actiu'
  },
  {
    id: 'c4',
    name: 'Club de Golf Llavaneras',
    location: 'Sant Andreu de Llavaneres, Barcelona',
    managerName: 'Carla Bosch',
    email: 'c.bosch@golfllavaneras.com',
    phone: '937 92 60 50',
    policyNumber: 'GC-664455-25',
    activeClaimsCount: 0,
    status: 'Pendent'
  }
];

export const mockClaims: Claim[] = [
  {
    id: '1',
    number: 'GC-2026-001',
    type: 'maquinària',
    status: 'Informe rebut',
    description: 'Avararia a la segadora principal del Green 14. Possible sobreescalfament del motor.',
    createdAt: new Date(2026, 4, 10, 10, 30),
    updatedAt: new Date(2026, 4, 12, 16, 0),
    estimatedCost: 1200,
    photos: ['https://picsum.photos/seed/mach1/800/600'],
    messages: [
      { id: 'msg1', sender: 'user', text: 'Hem tingut una avaria a la segadora.', timestamp: new Date(2026, 4, 10, 10, 30) },
      { id: 'msg2', sender: 'manager', text: 'D’acord, ja hem assignat un perit per revisar-la demà.', timestamp: new Date(2026, 4, 10, 11, 45) }
    ]
  },
  {
    id: '2',
    number: 'GC-2026-002',
    type: 'meteorològic',
    status: 'Declarat',
    description: 'Caiguda d\'arbre sobre el camí del forat 5 a causa de la tempesta de la passada nit.',
    createdAt: new Date(2026, 4, 14, 8, 15),
    updatedAt: new Date(2026, 4, 14, 8, 15),
    photos: ['https://picsum.photos/seed/tree1/800/600'],
    messages: []
  }
];
