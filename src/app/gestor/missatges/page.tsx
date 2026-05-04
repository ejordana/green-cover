"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import {
  getClaims,
  getGeneralMessages,
  sendGeneralMessage,
} from '@/lib/db';
import { ChatPanel } from '@/components/chat-panel';
import { supabase } from '@/lib/supabase';
import { Claim, ChatMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ConversationId = 'general' | string; // string = claimId

interface ConversationItem {
  id: ConversationId;
  label: string;
  sublabel: string;
  lastMessage: string;
  lastTime: Date | null;
  unread: number;
}

function GeneralChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getGeneralMessages().then(setMessages).catch(console.error);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel('gestor-general-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: 'claim_id=is.null',
        },
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

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      sender: 'manager',
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, optimistic]);
    setText('');
    try {
      const saved = await sendGeneralMessage('manager', optimistic.text);
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
      <div className="flex-1 overflow-y-auto space-y-2 p-4 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">
            Encara no hi ha missatges generals.
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender === 'manager';
          return (
            <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[80%] rounded-2xl px-3 py-2',
                isMe
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-slate-100 text-foreground rounded-bl-sm'
              )}>
                {!isMe && (
                  <p className="text-[10px] font-bold mb-1 text-slate-500">Client</p>
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

      <div className="border-t border-border/60 p-3 flex gap-2 bg-white flex-shrink-0">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Escriu un missatge general..."
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

export default function GestorMissatgesPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [generalMessages, setGeneralMessages] = useState<ChatMessage[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getClaims(),
      getGeneralMessages(),
    ]).then(([c, g]) => {
      setClaims(c);
      setGeneralMessages(g);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const conversations = useMemo((): ConversationItem[] => {
    // General
    const lastGeneral = generalMessages.length > 0
      ? generalMessages[generalMessages.length - 1]
      : null;

    const generalItem: ConversationItem = {
      id: 'general',
      label: 'General',
      sublabel: 'Canal general de comunicació',
      lastMessage: lastGeneral?.text ?? 'Sense missatges',
      lastTime: lastGeneral?.timestamp ?? null,
      unread: 0,
    };

    // Claims amb missatges
    const claimItems: ConversationItem[] = claims
      .filter(c => c.messages.length > 0)
      .map(c => {
        const sorted = [...c.messages].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const last = sorted[0];
        return {
          id: c.id,
          label: c.number,
          sublabel: c.title || c.type,
          lastMessage: last.text,
          lastTime: last.timestamp,
          unread: 0,
        };
      })
      .sort((a, b) => {
        if (!a.lastTime) return 1;
        if (!b.lastTime) return -1;
        return b.lastTime.getTime() - a.lastTime.getTime();
      });

    return [generalItem, ...claimItems];
  }, [claims, generalMessages]);

  const selectedClaim = useMemo(
    () => selectedConv && selectedConv !== 'general'
      ? claims.find(c => c.id === selectedConv) ?? null
      : null,
    [selectedConv, claims]
  );

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffH = diffMs / (1000 * 60 * 60);
    if (diffH < 24) return format(date, 'HH:mm', { locale: ca });
    return format(date, 'd MMM', { locale: ca });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-muted-foreground">Carregant missatges...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-5 min-h-[calc(100vh-120px)]">
      {/* Columna esquerra: llista de converses */}
      <div className={cn(
        "w-full md:w-72 flex-shrink-0",
        selectedConv ? "hidden md:flex md:flex-col" : "flex flex-col"
      )}>
        <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white overflow-hidden flex flex-col flex-1">
          <div className="px-4 py-3 border-b border-border/60 flex-shrink-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Converses
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv.id)}
                className={cn(
                  "w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-muted/20",
                  selectedConv === conv.id && "bg-primary/5 hover:bg-primary/5"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                  conv.id === 'general' ? "bg-primary/10" : "bg-slate-100"
                )}>
                  <MessageSquare className={cn(
                    "h-4 w-4",
                    conv.id === 'general' ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className="text-xs font-semibold text-foreground truncate">{conv.label}</p>
                    {conv.lastTime && (
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatTime(conv.lastTime)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground capitalize truncate">{conv.sublabel}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Columna dreta: xat */}
      <div className={cn(
        "flex-1 min-w-0",
        !selectedConv ? "hidden md:flex md:items-start" : "flex flex-col"
      )}>
        {selectedConv ? (
          <Card className="rounded-2xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white w-full overflow-hidden flex flex-col sticky top-[73px] max-h-[calc(100vh-100px)]">
            {/* Capçalera del xat */}
            <div className="px-5 py-3 border-b border-border/60 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setSelectedConv(null)}
                className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                selectedConv === 'general' ? "bg-primary/10" : "bg-slate-100"
              )}>
                <MessageSquare className={cn(
                  "h-3.5 w-3.5",
                  selectedConv === 'general' ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {selectedConv === 'general' ? 'General' : selectedClaim?.number ?? selectedConv}
                </p>
                {selectedConv !== 'general' && selectedClaim && (
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {selectedClaim.title || selectedClaim.type}
                  </p>
                )}
              </div>
            </div>

            {/* Contingut del xat */}
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              {selectedConv === 'general' ? (
                <GeneralChat />
              ) : selectedClaim ? (
                <ChatPanel
                  claimId={selectedClaim.id}
                  senderRole="manager"
                  initialMessages={selectedClaim.messages}
                />
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="w-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground bg-white rounded-2xl border border-dashed border-border p-12 text-center shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="bg-muted/50 p-5 rounded-2xl mb-4">
              <MessageSquare className="h-8 w-8 opacity-30" />
            </div>
            <p className="text-sm font-medium">Selecciona una conversa per veure els missatges.</p>
          </div>
        )}
      </div>
    </div>
  );
}
