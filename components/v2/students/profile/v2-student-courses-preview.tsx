import Link from 'next/link';
import { ArrowRight, BookOpenCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { StudentV2CoursePreview } from '@/lib/types/students-v2';

interface V2StudentCoursesPreviewProps {
  courses: readonly StudentV2CoursePreview[];
}

export function V2StudentCoursesPreview({ courses }: V2StudentCoursesPreviewProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="student-courses-title">
      <div className="border-b px-4 py-3">
        <h2 id="student-courses-title" className="flex items-center gap-2 font-semibold">
          <BookOpenCheck className="h-4 w-4 text-primary" aria-hidden />
          Cursos
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Vínculos académicos visibles.</p>
      </div>
      <ul className="divide-y">
        {courses.map((course) => (
          <li key={course.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <Link
                href={`/v2/courses/${course.id}`}
                className="truncate text-sm font-medium underline-offset-4 hover:text-primary hover:underline"
              >
                {course.name}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {course.sectionLabel} · {course.progressLabel}
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
