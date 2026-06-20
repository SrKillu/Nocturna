'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  GradebookV2FilterState,
  GradebookV2Record,
} from '@/lib/types/gradebook-v2';

interface V2GradebookFiltersProps {
  filters: GradebookV2FilterState;
  courseOptions: readonly Pick<GradebookV2Record, 'courseId' | 'courseName'>[];
  sectionOptions: readonly string[];
  onChange: (filters: GradebookV2FilterState) => void;
}

export function V2GradebookFilters({
  filters,
  courseOptions,
  sectionOptions,
  onChange,
}: V2GradebookFiltersProps) {
  return (
    <div className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-2 xl:grid-cols-[minmax(210px,1.25fr)_repeat(5,minmax(125px,0.65fr))]">
      <label className="relative">
        <span className="sr-only">Buscar en el libro de notas</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="Buscar estudiante, código o curso"
          className="pl-9"
        />
      </label>

      <Select value={filters.courseId} onValueChange={(courseId) => onChange({ ...filters, courseId })}>
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

      <Select value={filters.section} onValueChange={(section) => onChange({ ...filters, section })}>
        <SelectTrigger aria-label="Filtrar por sección">
          <SelectValue placeholder="Sección" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las secciones</SelectItem>
          {sectionOptions.map((section) => (
            <SelectItem key={section} value={section}>
              {section}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.period}
        onValueChange={(period) =>
          onChange({ ...filters, period: period as GradebookV2FilterState['period'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por período">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los períodos</SelectItem>
          <SelectItem value="current">Actual</SelectItem>
          <SelectItem value="previous">Anterior</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(status) =>
          onChange({ ...filters, status: status as GradebookV2FilterState['status'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por estado académico">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="on_track">Al día</SelectItem>
          <SelectItem value="watch">Atención</SelectItem>
          <SelectItem value="risk">En riesgo</SelectItem>
          <SelectItem value="pending">Sin completar</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.range}
        onValueChange={(range) =>
          onChange({ ...filters, range: range as GradebookV2FilterState['range'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por rango de nota">
          <SelectValue placeholder="Rango" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los rangos</SelectItem>
          <SelectItem value="high">90–100</SelectItem>
          <SelectItem value="middle">70–89</SelectItem>
          <SelectItem value="low">Menos de 70</SelectItem>
          <SelectItem value="ungraded">Sin nota</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
