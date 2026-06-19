'use client';

import { Search, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { StudentV2FilterState, StudentV2ListItem } from '@/lib/types/students-v2';

interface V2StudentFiltersProps {
  filters: StudentV2FilterState;
  courseOptions: readonly Pick<StudentV2ListItem, 'courseId' | 'courseName'>[];
  onChange: (filters: StudentV2FilterState) => void;
}

export function V2StudentFilters({
  filters,
  courseOptions,
  onChange,
}: V2StudentFiltersProps) {
  return (
    <div className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.4fr)_repeat(4,minmax(140px,0.7fr))]">
      <label className="relative">
        <span className="sr-only">Buscar estudiantes</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="Buscar nombre, código o curso"
          className="pl-9"
        />
      </label>

      <Select
        value={filters.status}
        onValueChange={(status) =>
          onChange({ ...filters, status: status as StudentV2FilterState['status'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por estado">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="active">Activos</SelectItem>
          <SelectItem value="follow_up">En seguimiento</SelectItem>
          <SelectItem value="inactive">Inactivos</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.level}
        onValueChange={(level) =>
          onChange({ ...filters, level: level as StudentV2FilterState['level'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por nivel">
          <SelectValue placeholder="Nivel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los niveles</SelectItem>
          <SelectItem value="primary">Primaria</SelectItem>
          <SelectItem value="secondary">Secundaria</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.courseId}
        onValueChange={(courseId) => onChange({ ...filters, courseId })}
      >
        <SelectTrigger aria-label="Filtrar por curso">
          <SelectValue placeholder="Curso" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los cursos</SelectItem>
          {courseOptions.map((course) => (
            <SelectItem key={course.courseId} value={course.courseId}>
              {course.courseName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.risk}
        onValueChange={(risk) =>
          onChange({ ...filters, risk: risk as StudentV2FilterState['risk'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por seguimiento">
          <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden />
          <SelectValue placeholder="Seguimiento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo seguimiento</SelectItem>
          <SelectItem value="on_track">Al día</SelectItem>
          <SelectItem value="watch">Atención</SelectItem>
          <SelectItem value="priority">Prioridad</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
