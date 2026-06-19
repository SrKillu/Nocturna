import Link from 'next/link';
import { ArrowRight, BookOpenCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { MySpaceV2Course } from '@/lib/types/my-space-v2';

interface V2MyCoursesPreviewProps {
  courses: readonly MySpaceV2Course[];
}

export function V2MyCoursesPreview({ courses }: V2MyCoursesPreviewProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="my-courses-title">
      <div className="border-b px-4 py-3 sm:px-5">
        <h2 id="my-courses-title" className="flex items-center gap-2 font-semibold">
          <BookOpenCheck className="h-4 w-4 text-primary" aria-hidden />
          Mis cursos
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Cursos académicos visibles para tu membresía.
        </p>
      </div>
      <ul className="divide-y">
        {courses.map((course) => (
          <li key={course.id} className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <Link
                href={`/v2/courses/${course.id}`}
                className="truncate text-sm font-medium underline-offset-4 hover:text-primary hover:underline"
              >
                {course.name}
              </Link>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {course.teacherName} · {course.scheduleLabel}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {course.progressLabel}
              </p>
            </div>
            <span className="flex items-center gap-2">
              <Badge variant="outline" className="hidden font-mono text-muted-foreground sm:inline-flex">
                {course.code}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
