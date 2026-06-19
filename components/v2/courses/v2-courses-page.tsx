'use client';

import { useMemo, useState } from 'react';
import { BookOpenCheck, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  type CourseV2FilterState,
  V2CourseFilters,
} from '@/components/v2/courses/v2-course-filters';
import { V2CoursesTable } from '@/components/v2/courses/v2-courses-table';
import type { CourseV2ListItem } from '@/lib/types/courses-v2';

interface V2CoursesPageProps {
  courses: readonly CourseV2ListItem[];
  canManageCourses: boolean;
}

const initialFilters: CourseV2FilterState = {
  query: '',
  status: 'all',
  level: 'all',
  category: 'all',
};

function courseMatchesFilters(
  course: CourseV2ListItem,
  filters: CourseV2FilterState
): boolean {
  const query = filters.query.trim().toLocaleLowerCase('es');
  const matchesQuery =
    query.length === 0 ||
    [course.name, course.code, course.teacherName].some((value) =>
      value.toLocaleLowerCase('es').includes(query)
    );

  return (
    matchesQuery &&
    (filters.status === 'all' || course.status === filters.status) &&
    (filters.level === 'all' || course.level === filters.level) &&
    (filters.category === 'all' || course.category === filters.category)
  );
}

export function V2CoursesPage({ courses, canManageCourses }: V2CoursesPageProps) {
  const [filters, setFilters] = useState<CourseV2FilterState>(initialFilters);
  const filteredCourses = useMemo(
    () => courses.filter((course) => courseMatchesFilters(course, filters)),
    [courses, filters]
  );
  const hasFilters = Object.entries(filters).some(
    ([key, value]) => value !== initialFilters[key as keyof CourseV2FilterState]
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Cursos</h1>
            <Badge variant="outline">Fundación C4</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta la oferta académica disponible para tu membresía activa.
          </p>
        </div>
        {canManageCourses ? (
          <span className="flex items-center gap-2 rounded-md border bg-muted/25 px-3 py-2 text-sm font-medium text-muted-foreground">
            <Plus className="h-4 w-4 text-primary" aria-hidden />
            Nuevo curso · próximamente
          </span>
        ) : null}
      </header>

      <V2CourseFilters filters={filters} onChange={setFilters} />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{filteredCourses.length}</span>{' '}
          {filteredCourses.length === 1 ? 'curso visible' : 'cursos visibles'}
        </p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BookOpenCheck className="h-4 w-4" aria-hidden />
          Datos académicos de demostración
        </span>
      </div>

      <V2CoursesTable courses={filteredCourses} filtered={hasFilters} />
    </div>
  );
}
