
import { Claim, Manager } from './types';

export const mockManager: Manager = {
  id: 'm1',
  name: 'Roger Jordana',
  photoUrl: 'https://picsum.photos/seed/manager/150/150',
  phone: '+34 600 000 000',
  available: true,
};

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
