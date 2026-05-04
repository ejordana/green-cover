
"use client";

import { Manager } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function ManagerContactCard({ manager }: { manager: Manager }) {
  return (
    <Card className="overflow-hidden border-none shadow-md bg-white">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-primary/10">
              <AvatarImage src={manager.photoUrl} alt={manager.name} />
              <AvatarFallback>{manager.name[0]}</AvatarFallback>
            </Avatar>
            {manager.available && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">El teu gestor</p>
            <h4 className="font-bold text-foreground leading-tight">{manager.name}</h4>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full h-10 w-10 bg-accent hover:bg-accent/80"
            onClick={() => window.location.href = `tel:${manager.phone}`}
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full h-10 w-10 bg-primary text-white hover:bg-primary/90"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
