"use client";

import { useEffect, useRef, useState } from 'react';
import { getManager, getGeneralMessages, sendGeneralMessage } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import type { Manager, ChatMessage } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function GestorPage() {
  const [manager, setManager] = useState<Manager | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getManager(), getGeneralMessages()])
      .then(([mgr, msgs]) => {
        setManager(mgr);
        setMessages(msgs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('general-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: 'claim_id=is.null' },
        (payload) => {
          const row = payload.new as any;
          const incoming: ChatMessage = {
            id: row.id,
            sender: row.sender,
            text: row.text,
            timestamp: new Date(row.created_at),
          };
          setMessages(prev =>
            prev.some(m => m.id === incoming.id) ? prev : [...prev, incoming]
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, optimistic]);
    setText('');
    try {
      const saved = await sendGeneralMessage('user', optimistic.text);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m));
    } catch (err) {
      console.error('[sendGeneralMessage] error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-130px)]">

      {/* Capçalera del gestor */}
      <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-1">
        {loading || !manager ? (
          <div className="h-12 w-48 bg-muted rounded-xl animate-pulse" />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-11 w-11 border border-border">
                  <AvatarImage src={manager.photoUrl} alt={manager.name} />
                  <AvatarFallback className="font-bold">{manager.name[0]}</AvatarFallback>
                </Avatar>
                {manager.available && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{manager.name}</p>
                <p className="text-xs text-muted-foreground">
                  {manager.available ? 'Disponible ara' : 'No disponible'}
                </p>
              </div>
            </div>
            <a href={`tel:${manager.phone}`}>
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                <Phone className="h-4 w-4" />
              </Button>
            </a>
          </>
        )}
      </div>

      {/* Missatges */}
      <div className="flex-1 overflow-y-auto space-y-2 py-3 min-h-0">
        {!loading && messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-10">
            Envia un missatge al teu gestor.
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender === 'user';
          return (
            <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[80%] rounded-2xl px-3 py-2',
                isMe
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-slate-100 text-foreground rounded-bl-sm'
              )}>
                <p className="text-sm leading-snug">{msg.text}</p>
                <p className={cn('text-[10px] mt-1 text-right', isMe ? 'text-white/60' : 'text-muted-foreground')}>
                  {format(msg.timestamp, 'HH:mm', { locale: ca })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-3 flex gap-2 bg-white">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Escriu un missatge..."
          className="text-sm h-10"
          disabled={sending}
        />
        <Button
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={handleSend}
          disabled={!text.trim() || sending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
