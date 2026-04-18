import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { accentFor, courseInitials } from '@/lib/ui/course-accents';
import { cn } from '@/lib/utils';
import type { CoursePreview } from '@/lib/services/dashboard.service';

interface CoursesCardProps {
  courses: CoursePreview[];
}

export function CoursesCard({ courses }: CoursesCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Tus cursos</CardTitle>
          <CardDescription>Accesos rápidos a los cursos que te conciernen.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href="/courses" aria-label="Ver todos los cursos">
            Ver todos <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1">
        {courses.length === 0 ? (
          <EmptyRow
            icon={<BookOpen className="h-5 w-5" aria-hidden />}
            title="Aún no tienes cursos"
            description="Los cursos que se creen en tu institución aparecerán aquí."
          />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {courses.map((course) => {
              const accent = accentFor(course.id);
              return (
                <li key={course.id}>
                  <Link
                    href={`/courses/${course.id}`}
                    aria-label={`Abrir curso ${course.name}`}
                    className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <span
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-semibold text-white',
                        accent.from,
                        accent.to
                      )}
                    >
                      {courseInitials(course.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary">
                        {course.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {course.description ?? 'Sin descripción'}
                      </p>
                    </div>
                    <ArrowRight
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-4 py-8 text-center">
      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
