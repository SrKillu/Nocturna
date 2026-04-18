'use client';

import { useState } from 'react';
import { CoursePickerAside, type PickerCourse } from '@/components/courses/course-picker-aside';
import { CourseMaterialsTab } from '@/components/courses/course-materials-tab';
import { FolderArchive } from 'lucide-react';
import type { UserRole } from '@/lib/types/database';

interface CourseOption extends PickerCourse {
  description: string | null;
  teacher_id: string | null;
}

interface Props {
  role: UserRole;
  userId: string;
  canManage: boolean;
  courses: CourseOption[];
  initialCourseId: string | null;
}

export function MaterialsWorkspace({
  role,
  userId,
  canManage,
  courses,
  initialCourseId,
}: Props) {
  const firstId =
    initialCourseId && courses.some((c) => c.id === initialCourseId)
      ? initialCourseId
      : courses[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(firstId);
  const selected = courses.find((c) => c.id === selectedId) ?? null;

  // El teacher solo puede gestionar su propio curso.
  const canManageThis =
    canManage &&
    selected != null &&
    (role === 'admin' || role === 'super_admin' || selected.teacher_id === userId);

  return (
    <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)] md:items-start">
      <div className="min-h-[420px] md:sticky md:top-4">
        <CoursePickerAside
          courses={courses.map((c) => ({ id: c.id, name: c.name }))}
          selectedId={selectedId}
          onSelect={setSelectedId}
          emptyHint="Todavía no estás inscripto en ningún curso."
        />
      </div>

      <div className="rounded-md border bg-card p-4 md:p-6">
        {!selected ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <FolderArchive className="h-5 w-5 text-muted-foreground" aria-hidden />
            </span>
            <p className="text-sm text-muted-foreground">
              Seleccioná un curso para ver sus materiales.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Curso
              </p>
              <h2 className="text-lg font-semibold">{selected.name}</h2>
              {selected.description ? (
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              ) : null}
            </div>
            <CourseMaterialsTab
              key={selected.id}
              courseId={selected.id}
              canManage={canManageThis}
            />
          </>
        )}
      </div>
    </div>
  );
}
