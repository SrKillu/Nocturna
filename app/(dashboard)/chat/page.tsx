import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/api/auth';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { listCourses } from '@/lib/services/courses.service';
import { PageHeader } from '@/components/layout/page-header';
import { ChatWorkspace } from '@/components/chat/chat-workspace';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: { courseId?: string };
}

export default async function ChatPage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  if (!isSupabaseConfigured()) notFound();

  const courses = (await listCourses(ctx)) as Array<{
    id: string;
    name: string;
  }>;

  return (
    <>
      <PageHeader
        title="Chat"
        description="Conversaciones por curso. Mensajes en tiempo casi real mientras el chat está abierto."
      />
      <ChatWorkspace
        ownUserId={ctx.userId}
        courses={courses.map((c) => ({ id: c.id, name: c.name }))}
        initialCourseId={searchParams.courseId ?? null}
      />
    </>
  );
}
