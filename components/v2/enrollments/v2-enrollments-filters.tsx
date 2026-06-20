'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EnrollmentV2FilterState, EnrollmentV2ListItem } from '@/lib/types/enrollments-v2';

interface Props {
  filters: EnrollmentV2FilterState;
  courseOptions: readonly Pick<EnrollmentV2ListItem, 'courseId' | 'courseLabel'>[];
  sectionOptions: readonly string[];
  onChange: (filters: EnrollmentV2FilterState) => void;
}

export function V2EnrollmentsFilters({ filters, courseOptions, sectionOptions, onChange }: Props) {
  return (
    <div className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      <label className="relative xl:col-span-2 2xl:col-span-1">
        <span className="sr-only">Buscar matrículas</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} placeholder="Buscar estudiante o curso" className="pl-9" />
      </label>
      <Select value={filters.courseId} onValueChange={(courseId) => onChange({ ...filters, courseId })}><SelectTrigger aria-label="Filtrar por curso"><SelectValue placeholder="Curso" /></SelectTrigger><SelectContent><SelectItem value="all">Todos los cursos</SelectItem>{courseOptions.map((course) => <SelectItem key={course.courseId} value={course.courseId}>{course.courseLabel}</SelectItem>)}</SelectContent></Select>
      <Select value={filters.section} onValueChange={(section) => onChange({ ...filters, section })}><SelectTrigger aria-label="Filtrar por sección"><SelectValue placeholder="Sección" /></SelectTrigger><SelectContent><SelectItem value="all">Todas las secciones</SelectItem>{sectionOptions.map((section) => <SelectItem key={section} value={section}>{section}</SelectItem>)}</SelectContent></Select>
      <Select value={filters.status} onValueChange={(status) => onChange({ ...filters, status: status as EnrollmentV2FilterState['status'] })}><SelectTrigger aria-label="Filtrar por estado"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos los estados</SelectItem><SelectItem value="active">Activa</SelectItem><SelectItem value="pending">Pendiente</SelectItem><SelectItem value="suspended">Suspendida</SelectItem><SelectItem value="completed">Completada</SelectItem><SelectItem value="withdrawn">Retirada</SelectItem><SelectItem value="review">En revisión</SelectItem></SelectContent></Select>
      <Select value={filters.period} onValueChange={(period) => onChange({ ...filters, period: period as EnrollmentV2FilterState['period'] })}><SelectTrigger aria-label="Filtrar por período"><SelectValue placeholder="Período" /></SelectTrigger><SelectContent><SelectItem value="all">Todos los períodos</SelectItem><SelectItem value="current">Actual</SelectItem><SelectItem value="previous">Anterior</SelectItem></SelectContent></Select>
      <Select value={filters.type} onValueChange={(type) => onChange({ ...filters, type: type as EnrollmentV2FilterState['type'] })}><SelectTrigger aria-label="Filtrar por tipo"><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="all">Todos los tipos</SelectItem><SelectItem value="regular">Regular</SelectItem><SelectItem value="extraordinary">Extraordinaria</SelectItem><SelectItem value="transfer">Traslado</SelectItem><SelectItem value="returning">Reingreso</SelectItem><SelectItem value="agreement">Beca / convenio</SelectItem></SelectContent></Select>
      <Select value={filters.risk} onValueChange={(risk) => onChange({ ...filters, risk: risk as EnrollmentV2FilterState['risk'] })}><SelectTrigger aria-label="Filtrar por seguimiento"><SelectValue placeholder="Seguimiento" /></SelectTrigger><SelectContent><SelectItem value="all">Todo seguimiento</SelectItem><SelectItem value="on_track">Al día</SelectItem><SelectItem value="watch">Atención</SelectItem><SelectItem value="priority">Prioridad</SelectItem></SelectContent></Select>
    </div>
  );
}
