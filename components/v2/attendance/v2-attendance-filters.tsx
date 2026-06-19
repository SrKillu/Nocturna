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
  AttendanceV2FilterState,
  AttendanceV2Record,
} from '@/lib/types/attendance-v2';

interface V2AttendanceFiltersProps {
  filters: AttendanceV2FilterState;
  courseOptions: readonly Pick<AttendanceV2Record, 'courseId' | 'courseName'>[];
  sectionOptions: readonly string[];
  onChange: (filters: AttendanceV2FilterState) => void;
}

export function V2AttendanceFilters({
  filters,
  courseOptions,
  sectionOptions,
  onChange,
}: V2AttendanceFiltersProps) {
  return (
    <div className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.35fr)_repeat(4,minmax(140px,0.7fr))]">
      <label className="relative">
        <span className="sr-only">Buscar asistencia</span>
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
        value={filters.section}
        onValueChange={(section) => onChange({ ...filters, section })}
      >
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
          onChange({ ...filters, period: period as AttendanceV2FilterState['period'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por período">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo el período</SelectItem>
          <SelectItem value="today">Hoy</SelectItem>
          <SelectItem value="week">Esta semana</SelectItem>
          <SelectItem value="month">Este mes</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(status) =>
          onChange({ ...filters, status: status as AttendanceV2FilterState['status'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por estado">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="present">Presente</SelectItem>
          <SelectItem value="late">Tardía</SelectItem>
          <SelectItem value="absent">Ausente</SelectItem>
          <SelectItem value="pending">Pendiente</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
