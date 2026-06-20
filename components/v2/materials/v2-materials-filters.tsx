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
  MaterialV2FilterState,
  MaterialV2ListItem,
} from '@/lib/types/materials-v2';

interface V2MaterialsFiltersProps {
  filters: MaterialV2FilterState;
  courseOptions: readonly Pick<MaterialV2ListItem, 'courseId' | 'courseName'>[];
  sectionOptions: readonly string[];
  onChange: (filters: MaterialV2FilterState) => void;
}

export function V2MaterialsFilters({
  filters,
  courseOptions,
  sectionOptions,
  onChange,
}: V2MaterialsFiltersProps) {
  return (
    <div className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-2 xl:grid-cols-[minmax(210px,1.25fr)_repeat(5,minmax(125px,0.65fr))]">
      <label className="relative">
        <span className="sr-only">Buscar materiales</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="Buscar material o curso"
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
          onChange({ ...filters, type: type as MaterialV2FilterState['type'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por tipo">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="document">Documento</SelectItem>
          <SelectItem value="slides">Presentación</SelectItem>
          <SelectItem value="video">Video</SelectItem>
          <SelectItem value="link">Referencia</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.visibility}
        onValueChange={(visibility) =>
          onChange({
            ...filters,
            visibility: visibility as MaterialV2FilterState['visibility'],
          })
        }
      >
        <SelectTrigger aria-label="Filtrar por visibilidad">
          <SelectValue placeholder="Visibilidad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toda visibilidad</SelectItem>
          <SelectItem value="course">Curso</SelectItem>
          <SelectItem value="staff">Equipo</SelectItem>
          <SelectItem value="draft">Borrador</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.period}
        onValueChange={(period) =>
          onChange({ ...filters, period: period as MaterialV2FilterState['period'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por período">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los períodos</SelectItem>
          <SelectItem value="current">Actual</SelectItem>
          <SelectItem value="recent">Reciente</SelectItem>
          <SelectItem value="previous">Anterior</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
