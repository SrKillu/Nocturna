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
import type { StaffV2FilterState, StaffV2ListItem } from '@/lib/types/staff-v2';

interface V2StaffFiltersProps {
  filters: StaffV2FilterState;
  assignmentOptions: readonly Pick<
    StaffV2ListItem,
    'assignmentId' | 'assignmentLabel'
  >[];
  onChange: (filters: StaffV2FilterState) => void;
}

export function V2StaffFilters({
  filters,
  assignmentOptions,
  onChange,
}: V2StaffFiltersProps) {
  return (
    <div className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.4fr)_repeat(4,minmax(140px,0.7fr))]">
      <label className="relative">
        <span className="sr-only">Buscar personal</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="Buscar persona, código o área"
          className="pl-9"
        />
      </label>
      <Select
        value={filters.role}
        onValueChange={(role) =>
          onChange({ ...filters, role: role as StaffV2FilterState['role'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por rol">
          <SelectValue placeholder="Rol" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los roles</SelectItem>
          <SelectItem value="admin">Administración</SelectItem>
          <SelectItem value="teacher">Docentes</SelectItem>
          <SelectItem value="assistant">Asistentes</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.status}
        onValueChange={(status) =>
          onChange({ ...filters, status: status as StaffV2FilterState['status'] })
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
        value={filters.area}
        onValueChange={(area) =>
          onChange({ ...filters, area: area as StaffV2FilterState['area'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por área">
          <SelectValue placeholder="Área" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las áreas</SelectItem>
          <SelectItem value="administration">Administración</SelectItem>
          <SelectItem value="sciences">Ciencias</SelectItem>
          <SelectItem value="languages">Idiomas</SelectItem>
          <SelectItem value="humanities">Humanidades</SelectItem>
          <SelectItem value="technology">Tecnología</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.assignmentId}
        onValueChange={(assignmentId) => onChange({ ...filters, assignmentId })}
      >
        <SelectTrigger aria-label="Filtrar por asignación">
          <SelectValue placeholder="Curso / sección" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las asignaciones</SelectItem>
          {assignmentOptions.map((assignment) => (
            <SelectItem key={assignment.assignmentId} value={assignment.assignmentId}>
              {assignment.assignmentLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
