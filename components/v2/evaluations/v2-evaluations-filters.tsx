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
  EvaluationV2FilterState,
  EvaluationV2ListItem,
} from '@/lib/types/evaluations-v2';

interface V2EvaluationsFiltersProps {
  filters: EvaluationV2FilterState;
  courseOptions: readonly Pick<EvaluationV2ListItem, 'courseId' | 'courseName'>[];
  sectionOptions: readonly string[];
  onChange: (filters: EvaluationV2FilterState) => void;
}

export function V2EvaluationsFilters({
  filters,
  courseOptions,
  sectionOptions,
  onChange,
}: V2EvaluationsFiltersProps) {
  return (
    <div className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-2 xl:grid-cols-[minmax(210px,1.25fr)_repeat(5,minmax(125px,0.65fr))]">
      <label className="relative">
        <span className="sr-only">Buscar evaluaciones</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="Buscar evaluación o curso"
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
        value={filters.type}
        onValueChange={(type) =>
          onChange({ ...filters, type: type as EvaluationV2FilterState['type'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por tipo">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="quiz">Prueba corta</SelectItem>
          <SelectItem value="project">Proyecto</SelectItem>
          <SelectItem value="exam">Examen</SelectItem>
          <SelectItem value="assignment">Tarea</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(status) =>
          onChange({ ...filters, status: status as EvaluationV2FilterState['status'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por estado">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="draft">Borrador</SelectItem>
          <SelectItem value="active">Activa</SelectItem>
          <SelectItem value="review">En revisión</SelectItem>
          <SelectItem value="completed">Completada</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.period}
        onValueChange={(period) =>
          onChange({ ...filters, period: period as EvaluationV2FilterState['period'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por período">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los períodos</SelectItem>
          <SelectItem value="current">Actual</SelectItem>
          <SelectItem value="upcoming">Próximo</SelectItem>
          <SelectItem value="previous">Anterior</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
