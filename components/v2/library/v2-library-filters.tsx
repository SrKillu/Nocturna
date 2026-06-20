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
  LibraryV2Collection,
  LibraryV2FilterState,
  LibraryV2Resource,
} from '@/lib/types/library-v2';

interface V2LibraryFiltersProps {
  filters: LibraryV2FilterState;
  collections: readonly LibraryV2Collection[];
  courseOptions: readonly Pick<LibraryV2Resource, 'courseId' | 'courseName'>[];
  onChange: (filters: LibraryV2FilterState) => void;
}

export function V2LibraryFilters({
  filters,
  collections,
  courseOptions,
  onChange,
}: V2LibraryFiltersProps) {
  return (
    <div className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-2 xl:grid-cols-[minmax(210px,1.25fr)_repeat(6,minmax(120px,0.65fr))]">
      <label className="relative">
        <span className="sr-only">Buscar recursos</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="Buscar recurso"
          className="pl-9"
        />
      </label>

      <Select
        value={filters.collectionId}
        onValueChange={(collectionId) => onChange({ ...filters, collectionId })}
      >
        <SelectTrigger aria-label="Filtrar por colección">
          <SelectValue placeholder="Colección" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Colecciones</SelectItem>
          {collections.map((collection) => (
            <SelectItem key={collection.id} value={collection.id}>
              {collection.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.type}
        onValueChange={(type) =>
          onChange({ ...filters, type: type as LibraryV2FilterState['type'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por tipo">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tipos</SelectItem>
          <SelectItem value="digital-book">Libro digital</SelectItem>
          <SelectItem value="study-guide">Guía de estudio</SelectItem>
          <SelectItem value="supplemental-reading">Lectura</SelectItem>
          <SelectItem value="external-video">Video simulado</SelectItem>
          <SelectItem value="practice">Práctica</SelectItem>
          <SelectItem value="institutional-reference">Referencia</SelectItem>
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
          <SelectItem value="all">Cursos</SelectItem>
          {courseOptions.map((course) => (
            <SelectItem key={course.courseId} value={course.courseId ?? 'general'}>
              {course.courseName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.level}
        onValueChange={(level) =>
          onChange({ ...filters, level: level as LibraryV2FilterState['level'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por nivel">
          <SelectValue placeholder="Nivel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Niveles</SelectItem>
          <SelectItem value="primary">Primaria</SelectItem>
          <SelectItem value="secondary">Secundaria</SelectItem>
          <SelectItem value="general">Institucional</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.availability}
        onValueChange={(availability) =>
          onChange({
            ...filters,
            availability:
              availability as LibraryV2FilterState['availability'],
          })
        }
      >
        <SelectTrigger aria-label="Filtrar por disponibilidad">
          <SelectValue placeholder="Disponibilidad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Disponibilidad</SelectItem>
          <SelectItem value="available">Disponible</SelectItem>
          <SelectItem value="reference">Referencia</SelectItem>
          <SelectItem value="featured">Destacado</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.period}
        onValueChange={(period) =>
          onChange({ ...filters, period: period as LibraryV2FilterState['period'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por período">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Períodos</SelectItem>
          <SelectItem value="current">Actual</SelectItem>
          <SelectItem value="recent">Reciente</SelectItem>
          <SelectItem value="previous">Anterior</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
