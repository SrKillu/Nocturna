import 'server-only';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';

const CONTENT_MAX = 2000;
const PAGE_SIZE = 100;

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Mensaje vacío').max(CONTENT_MAX),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: { id: string; full_name: string | null; email: string } | null;
}

async function getCourse(
  courseId: string
): Promise<{ institution_id: string } | null> {
  const sb = createClient();
  const { data } = await sb
    .from('courses')
    .select('institution_id')
    .eq('id', courseId)
    .maybeSingle();
  return data as { institution_id: string } | null;
}

/**
 * Paginated, newest-first by default; we flip to newest-last in the UI so the
 * chat scroll feels natural. `since` enables cheap polling: pass the client's
 * last-seen created_at and we only return messages newer than that.
 */
export async function listMessages(
  ctx: AuthenticatedContext,
  courseId: string,
  opts: { since?: string; limit?: number } = {}
): Promise<ChatMessage[]> {
  const sb = createClient();
  const limit = Math.min(opts.limit ?? PAGE_SIZE, PAGE_SIZE);

  let q = sb
    .from('messages')
    .select('id, content, created_at, sender_id')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (opts.since) q = q.gt('created_at', opts.since);

  const { data, error } = await q;
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  const msgs = (data ?? []) as Array<{
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
  }>;
  if (msgs.length === 0) return [];

  // Hydrate senders in one round-trip.
  const ids = [...new Set(msgs.map((m) => m.sender_id))];
  const profRes = await sb
    .from('profiles')
    .select('id, full_name, email')
    .in('id', ids);
  const byId = new Map(
    (profRes.data ?? []).map((p) => [
      p.id as string,
      { id: p.id as string, full_name: (p.full_name as string | null) ?? null, email: p.email as string },
    ])
  );

  return msgs
    .map((m) => ({
      id: m.id,
      content: m.content,
      created_at: m.created_at,
      sender_id: m.sender_id,
      sender: byId.get(m.sender_id) ?? null,
    }))
    .reverse(); // newest-last for chat UI
}

export async function sendMessage(
  ctx: AuthenticatedContext,
  courseId: string,
  input: SendMessageInput
): Promise<ChatMessage> {
  const course = await getCourse(courseId);
  if (!course) throw new ApiError('NOT_FOUND', 'Curso no encontrado');

  const sb = createClient();
  const { data, error } = await sb
    .from('messages')
    .insert({
      institution_id: course.institution_id,
      course_id: courseId,
      sender_id: ctx.userId,
      content: input.content.trim(),
    })
    .select('id, content, created_at, sender_id')
    .single();
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);

  // Attach sender for the immediate UI echo.
  const profRes = await sb
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', ctx.userId)
    .maybeSingle();
  const sender = profRes.data
    ? {
        id: profRes.data.id as string,
        full_name: (profRes.data.full_name as string | null) ?? null,
        email: profRes.data.email as string,
      }
    : null;

  return {
    id: data.id as string,
    content: data.content as string,
    created_at: data.created_at as string,
    sender_id: data.sender_id as string,
    sender,
  };
}

export async function deleteMessage(
  ctx: AuthenticatedContext,
  messageId: string
): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from('messages').delete().eq('id', messageId);
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
}
