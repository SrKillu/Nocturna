'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TaskFilterBarProps {
  courses: Array<{ id: string; name: string }>;
  selectedCourseId: string | null;
}

const ALL = '__all__';

/**
 * Client-side filter that pushes the selected courseId into the URL search
 * params (`?courseId=`). The page re-renders on the server with the new
 * filter applied, so state is URL-first and shareable.
 */
export function TaskFilterBar({ courses, selectedCourseId }: TaskFilterBarProps) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(next: string): void {
    const url = new URLSearchParams(params.toString());
    if (next === ALL) url.delete('courseId');
    else url.set('courseId', next);
    router.push(`/tasks${url.toString() ? `?${url.toString()}` : ''}`);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Filtrar por curso
      </p>
      <div className="w-full max-w-xs">
        <Select value={selectedCourseId ?? ALL} onValueChange={onChange}>
          <SelectTrigger aria-label="Curso">
            <SelectValue placeholder="Todos los cursos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los cursos</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
