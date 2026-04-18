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
import type { CoursePreview } from '@/lib/services/dashboard.service';

interface CoursesCardProps {
  courses: CoursePreview[];
}

export function CoursesCard({ courses }: CoursesCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Cursos activos</CardTitle>
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
          <ul className="divide-y">
            {courses.map((course) => (
              <li key={course.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{course.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {course.description ?? 'Sin descripción'}
                  </p>
                </div>
                <Link
                  href={`/courses?id=${course.id}`}
                  aria-label={`Abrir curso ${course.name}`}
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                >
                  Abrir
                </Link>
              </li>
            ))}
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
