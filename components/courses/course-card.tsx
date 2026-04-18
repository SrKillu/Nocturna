import Link from 'next/link';
import { User2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { accentFor, courseInitials } from '@/lib/ui/course-accents';
import { formatRelativeDate } from '@/lib/utils/date';

interface CourseCardProps {
  course: {
    id: string;
    name: string;
    description: string | null;
    teacher_id: string | null;
    created_at: string;
  };
  teacherName?: string | null;
  status?: 'active' | 'archived';
  href?: string;
}

/**
 * Google Classroom-inspired course card.
 *   * Large colored gradient hero with the course initials on the right.
 *   * Clear hierarchy: name prominent, teacher below, meta at the bottom.
 *   * Deterministic accent per course id so the visual memory stays stable.
 *   * When wrapped in an <a>/<Link>, the caller handles focus & aria-label;
 *     we add our own focus ring for the standalone use case.
 */
export function CourseCard({
  course,
  teacherName,
  status = 'active',
  href,
}: CourseCardProps) {
  const accent = accentFor(course.id);
  const initials = courseInitials(course.name);

  const body = (
    <Card
      className={cn(
        'group flex h-full flex-col overflow-hidden border-border/60 bg-card shadow-sm transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md hover:ring-2 hover:ring-offset-2 hover:ring-offset-background',
        accent.ring
      )}
    >
      <div
        aria-hidden
        className={cn(
          'relative flex h-28 items-start justify-between overflow-hidden bg-gradient-to-br px-5 pt-5 text-white',
          accent.from,
          accent.to
        )}
      >
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-wider opacity-80">Curso</p>
          <p className="mt-1 line-clamp-2 text-base font-semibold leading-tight">
            {course.name}
          </p>
        </div>
        <span
          className={cn(
            'relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold backdrop-blur-sm',
            accent.chip
          )}
        >
          {initials}
        </span>
        {/* Soft decorative circles, pure CSS, no images */}
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-black/10 blur-3xl" />
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <User2 className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="truncate text-foreground">
            {teacherName?.trim() ? teacherName : 'Sin profesor asignado'}
          </span>
        </div>
        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
          {course.description ?? 'Sin descripción.'}
        </p>
        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>Creado {formatRelativeDate(course.created_at)}</span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
              status === 'active'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <span
              aria-hidden
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground/60'
              )}
            />
            {status === 'active' ? 'Activo' : 'Archivado'}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  if (!href) return body;
  return (
    <Link
      href={href}
      aria-label={`Abrir curso ${course.name}`}
      className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {body}
    </Link>
  );
}
