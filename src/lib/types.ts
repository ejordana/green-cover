
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
}

export interface Manager {
  id: string;
  name: string;
  photoUrl: string;
  phone: string;
  available: boolean;
}
