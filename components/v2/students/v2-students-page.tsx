'use client';

import { useMemo, useState } from 'react';
import { UserPlus, UsersRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { V2StudentFilters } from '@/components/v2/students/v2-student-filters';
import { V2StudentsTable } from '@/components/v2/students/v2-students-table';
import {
  filterStudentsV2,
  type StudentV2FilterState,
  type StudentV2ListItem,
} from '@/lib/types/students-v2';

interface V2StudentsPageProps {
  students: readonly StudentV2ListItem[];
  canManageCourses: boolean;
}

const initialFilters: StudentV2FilterState = {
  query: '',
  status: 'all',
  level: 'all',
  courseId: 'all',
  risk: 'all',
};

export function V2StudentsPage({ students, canManageCourses }: V2StudentsPageProps) {
  const [filters, setFilters] = useState<StudentV2FilterState>(initialFilters);
  const filteredStudents = useMemo(
    () => filterStudentsV2(students, filters),
    [students, filters]
  );
  const courseOptions = useMemo(() => {
    const courses = new Map<string, string>();
    students.forEach((student) => courses.set(student.courseId, student.courseName));
    return Array.from(courses, ([courseId, courseName]) => ({ courseId, courseName }));
  }, [students]);
  const hasFilters = Object.entries(filters).some(
    ([key, value]) => value !== initialFilters[key as keyof StudentV2FilterState]
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Estudiantes</h1>
            <Badge variant="outline">Fundación C6</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta el seguimiento académico visible para tu membresía activa.
          </p>
        </div>
        {canManageCourses ? (
          <span className="flex items-center gap-2 rounded-md border bg-muted/25 px-3 py-2 text-sm font-medium text-muted-foreground">
            <UserPlus className="h-4 w-4 text-primary" aria-hidden />
            Agregar estudiante · próximamente
          </span>
        ) : null}
      </header>

      <V2StudentFilters
        filters={filters}
        courseOptions={courseOptions}
        onChange={setFilters}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{filteredStudents.length}</span>{' '}
          {filteredStudents.length === 1 ? 'estudiante visible' : 'estudiantes visibles'}
        </p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <UsersRound className="h-4 w-4" aria-hidden />
          Datos académicos de demostración
        </span>
      </div>

      <V2StudentsTable students={filteredStudents} filtered={hasFilters} />
    </div>
  );
}
