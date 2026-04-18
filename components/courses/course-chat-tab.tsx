'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { apiFetch } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: { id: string; full_name: string | null; email: string } | null;
}

const POLL_INTERVAL_MS = 5000;
const MAX_LEN = 2000;

function initialsFor(m: ChatMessage): string {
  const src = (m.sender?.full_name ?? m.sender?.email ?? '?').trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

function timeOf(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return '';
  }
}

export function CourseChatTab({
  courseId,
  ownUserId,
}: {
  courseId: string;
  ownUserId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSeenRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/courses/${courseId}/messages?limit=100`);
      const json = (await res.json().catch(() => ({}))) as { data?: ChatMessage[] };
      const list = json.data ?? [];
      setMessages(list);
      lastSeenRef.current = list.length > 0 ? list[list.length - 1].created_at : null;
    } finally {
      setLoading(false);
      // next tick so DOM has painted
      setTimeout(scrollToBottom, 50);
    }
  }, [courseId, scrollToBottom]);

  const pollNew = useCallback(async () => {
    const since = lastSeenRef.current;
    if (!since) return;
    try {
      const res = await apiFetch(
        `/api/courses/${courseId}/messages?since=${encodeURIComponent(since)}`
      );
      if (!res.ok) return;
      const json = (await res.json().catch(() => ({}))) as { data?: ChatMessage[] };
      const newer = json.data ?? [];
      if (newer.length === 0) return;
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const toAdd = newer.filter((m) => !seen.has(m.id));
        if (toAdd.length === 0) return prev;
        return [...prev, ...toAdd];
      });
      lastSeenRef.current = newer[newer.length - 1].created_at;
      setTimeout(scrollToBottom, 30);
    } catch {
      /* swallow: next tick retries */
    }
  }, [courseId, scrollToBottom]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    // Only poll while tab is visible to avoid hammering the API.
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id != null) return;
      id = setInterval(pollNew, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (id != null) {
        clearInterval(id);
        id = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void pollNew();
        start();
      } else {
        stop();
      }
    };
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [pollNew]);

  async function onSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    if (content.length > MAX_LEN) {
      toast.error(`Máximo ${MAX_LEN} caracteres`);
      return;
    }
    setSending(true);
    // Optimistic render.
    const tempId = `tmp:${crypto.randomUUID()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      content,
      created_at: new Date().toISOString(),
      sender_id: ownUserId,
      sender: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    setTimeout(scrollToBottom, 30);

    try {
      const res = await apiFetch(`/api/courses/${courseId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: ChatMessage;
        error?: { message?: string };
      };
      if (!res.ok || !json.data) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error('No se pudo enviar', { description: json.error?.message });
        setDraft(content); // restore draft
        return;
      }
      const saved = json.data;
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? saved : m))
      );
      lastSeenRef.current = saved.created_at;
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void onSend();
    }
  }

  const grouped = useMemo(() => messages, [messages]);

  return (
    <div className="flex h-[min(60vh,640px)] flex-col overflow-hidden rounded-md border bg-card">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando mensajes…</p>
        ) : grouped.length === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Todavía no hay mensajes. ¡Envía el primero!
          </p>
        ) : (
          <ul className="space-y-3">
            {grouped.map((m) => {
              const mine = m.sender_id === ownUserId;
              return (
                <li
                  key={m.id}
                  className={cn('flex gap-3', mine ? 'flex-row-reverse' : '')}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">{initialsFor(m)}</AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      'max-w-[70%] rounded-lg px-3 py-2 text-sm',
                      mine
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    {!mine ? (
                      <p className="mb-0.5 text-[11px] font-medium text-muted-foreground">
                        {m.sender?.full_name?.trim() || m.sender?.email || 'Usuario'}
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p
                      className={cn(
                        'mt-1 text-[10px] opacity-70',
                        mine ? 'text-right' : 'text-left'
                      )}
                    >
                      {timeOf(m.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={onSend}
        className="flex items-end gap-2 border-t bg-background p-3"
      >
        <Textarea
          rows={1}
          placeholder="Escribe un mensaje…   (Enter para enviar · Shift+Enter salto de línea)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={sending}
          className="min-h-10 resize-none"
          maxLength={MAX_LEN}
        />
        <Button type="submit" disabled={sending || !draft.trim()}>
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">Enviar</span>
        </Button>
      </form>
    </div>
  );
}
