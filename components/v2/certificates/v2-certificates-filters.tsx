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
  CertificateV2FilterState,
  CertificateV2ListItem,
} from '@/lib/types/certificates-v2';

interface V2CertificatesFiltersProps {
  filters: CertificateV2FilterState;
  courseOptions: readonly Pick<
    CertificateV2ListItem,
    'courseId' | 'courseLabel' | 'sectionLabel'
  >[];
  onChange: (filters: CertificateV2FilterState) => void;
}

export function V2CertificatesFilters({
  filters,
  courseOptions,
  onChange,
}: V2CertificatesFiltersProps) {
  return (
    <div className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-2 xl:grid-cols-[minmax(210px,1.25fr)_repeat(5,minmax(125px,0.65fr))]">
      <label className="relative">
        <span className="sr-only">Buscar certificados</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="Buscar estudiante o grupo"
          className="pl-9"
        />
      </label>
      <Select
        value={filters.type}
        onValueChange={(type) =>
          onChange({ ...filters, type: type as CertificateV2FilterState['type'] })
        }
      >
        <SelectTrigger aria-label="Filtrar por tipo">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="approval">Aprobación</SelectItem>
          <SelectItem value="enrollment">Matrícula</SelectItem>
          <SelectItem value="attendance">Asistencia</SelectItem>
          <SelectItem value="completion">Finalización</SelectItem>
          <SelectItem value="recognition">Reconocimiento</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.courseId}
        onValueChange={(courseId) => onChange({ ...filters, courseId })}
      >
        <SelectTrigger aria-label="Filtrar por curso o sección">
          <SelectValue placeholder="Curso / sección" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los cursos</SelectItem>
          {courseOptions.map((course) => (
            <SelectItem key={course.courseId} value={course.courseId}>
              {course.courseLabel} · {course.sectionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.period}
        onValueChange={(period) =>
          onChange({
            ...filters,
            period: period as CertificateV2FilterState['period'],
          })
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
          onChange({
            ...filters,
            status: status as CertificateV2FilterState['status'],
          })
        }
      >
        <SelectTrigger aria-label="Filtrar por estado">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="pending">Pendiente</SelectItem>
          <SelectItem value="review">En revisión</SelectItem>
          <SelectItem value="ready">Listo para revisión</SelectItem>
          <SelectItem value="blocked">Bloqueado</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.eligibility}
        onValueChange={(eligibility) =>
          onChange({
            ...filters,
            eligibility:
              eligibility as CertificateV2FilterState['eligibility'],
          })
        }
      >
        <SelectTrigger aria-label="Filtrar por elegibilidad">
          <SelectValue placeholder="Elegibilidad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toda elegibilidad</SelectItem>
          <SelectItem value="eligible">Elegible</SelectItem>
          <SelectItem value="review">Revisar</SelectItem>
          <SelectItem value="not_eligible">No elegible</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
