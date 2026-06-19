import Link from 'next/link';
import { BookOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function CourseWorkspaceV2NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <BookOpen className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="text-xl font-semibold">Curso no disponible</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        El curso solicitado no existe o no está visible para tu membresía activa.
      </p>
      <Button asChild className="mt-5">
        <Link href="/v2/courses">Volver a cursos</Link>
      </Button>
    </div>
  );
}
