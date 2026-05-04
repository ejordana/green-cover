
export type ClaimType = 'RC' | 'meteorològic' | 'maquinària' | 'accident personal' | 'ciberincident' | 'altres';

export type ClaimStatus = 
  | 'Declarat' 
  | 'Gestor assignat' 
  | 'Perit designat' 
  | 'Informe rebut' 
  | 'Aprovat' 
  | 'Pagat' 
  | 'Tancat';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'manager';
  text: string;
  timestamp: Date;
}

export interface Claim {
  id: string;
  number: string;
  type: ClaimType;
  status: ClaimStatus;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedCost?: number;
  location?: { lat: number; lng: number };
  photos: string[];
  messages: ChatMessage[];
  assignedExpertId?: string;
  notes?: string;
  incidentAt?: Date;
}

export interface Manager {
  id: string;
  name: string;
  photoUrl: string;
  phone: string;
  available: boolean;
}

export interface Client {
  id: string;
  name: string;
  location: string;
  managerName: string;
  email: string;
  phone: string;
  policyNumber: string;
  activeClaimsCount: number;
  status: 'Actiu' | 'Inactiu' | 'Pendent';
}

export interface Expert {
  id: string;
  name: string;
  specialty: string;
  zone: string;
  phone: string;
  email: string;
  rating: number;
  activeClaims: number;
}
