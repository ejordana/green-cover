"use client";

import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/lib/types';
import { sendMessage } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  claimId: string;
  senderRole: 'user' | 'manager';
  initialMessages: ChatMessage[];
}

export function ChatPanel({ claimId, senderRole, initialMessages }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    [...initialMessages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  );
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${claimId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `claim_id=eq.${claimId}` },
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
  }, [claimId]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      sender: senderRole,
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, optimistic]);
    setText('');
    try {
      const saved = await sendMessage(claimId, senderRole, optimistic.text);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setText(optimistic.text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 p-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-6">
            Encara no hi ha missatges en aquest sinistre.
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender === senderRole;
          return (
            <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[80%] rounded-2xl px-3 py-2',
                isMe
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-slate-100 text-foreground rounded-bl-sm'
              )}>
                {!isMe && (
                  <p className="text-[10px] font-bold mb-1 text-slate-500">
                    {msg.sender === 'manager' ? 'Gestor' : 'Client'}
                  </p>
                )}
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

      <div className="border-t p-3 flex gap-2 bg-white">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Escriu un missatge..."
          className="text-sm h-9"
          disabled={sending}
        />
        <Button
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={handleSend}
          disabled={!text.trim() || sending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
