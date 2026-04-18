'use client';

import { useState } from 'react';
import { CoursePickerAside, type PickerCourse } from '@/components/courses/course-picker-aside';
import { CourseChatTab } from '@/components/courses/course-chat-tab';
import { MessageSquare } from 'lucide-react';

interface Props {
  ownUserId: string;
  courses: PickerCourse[];
  initialCourseId: string | null;
}

export function ChatWorkspace({ ownUserId, courses, initialCourseId }: Props) {
  const firstId =
    initialCourseId && courses.some((c) => c.id === initialCourseId)
      ? initialCourseId
      : courses[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(firstId);
  const selected = courses.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)] md:items-start">
      <div className="min-h-[420px] md:sticky md:top-4">
        <CoursePickerAside
          courses={courses}
          selectedId={selectedId}
          onSelect={setSelectedId}
          emptyHint="No tens cursos asignados aún."
        />
      </div>

      <div className="rounded-md border bg-card p-4 md:p-6">
        {!selected ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-5 w-5 text-muted-foreground" aria-hidden />
            </span>
            <p className="text-sm text-muted-foreground">
              Seleccioná un curso para abrir el chat.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Chat del curso
              </p>
              <h2 className="text-lg font-semibold">{selected.name}</h2>
            </div>
            <CourseChatTab key={selected.id} courseId={selected.id} ownUserId={ownUserId} />
          </div>
        )}
      </div>
    </div>
  );
}
