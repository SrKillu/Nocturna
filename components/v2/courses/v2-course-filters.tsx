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
import type {
  CourseV2Category,
  CourseV2Level,
  CourseV2Status,
} from '@/lib/types/courses-v2';

export interface CourseV2FilterState {
  query: string;
  status: CourseV2Status | 'all';
  level: CourseV2Level | 'all';
  category: CourseV2Category | 'all';
}

interface V2CourseFiltersProps {
  filters: CourseV2FilterState;
  onChange: (filters: CourseV2FilterState) => void;
}

export function V2CourseFilters({ filters, onChange }: V2CourseFiltersProps) {
  return (
    <div className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.4fr)_repeat(3,minmax(150px,0.7fr))]">
      <label className="relative">
        <span className="sr-only">Buscar cursos</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="Buscar curso, código o docente"
          className="pl-9"
        />
      </label>

      <Select
        value={filters.status}
        onValueChange={(status) =>
          onChange({ ...filters, status: status as CourseV2FilterState['status'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por estado">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="active">Activos</SelectItem>
          <SelectItem value="planning">En preparación</SelectItem>
          <SelectItem value="completed">Finalizados</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.level}
        onValueChange={(level) =>
          onChange({ ...filters, level: level as CourseV2FilterState['level'] })
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
        value={filters.category}
        onValueChange={(category) =>
          onChange({ ...filters, category: category as CourseV2FilterState['category'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por categoría">
          <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden />
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          <SelectItem value="sciences">Ciencias</SelectItem>
          <SelectItem value="languages">Idiomas</SelectItem>
          <SelectItem value="humanities">Humanidades</SelectItem>
          <SelectItem value="technology">Tecnología</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
