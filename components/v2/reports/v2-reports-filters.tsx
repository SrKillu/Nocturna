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
import type { ReportV2FilterState, ReportV2ListItem } from '@/lib/types/reports-v2';

interface Props {
  filters: ReportV2FilterState;
  courseOptions: readonly Pick<ReportV2ListItem, 'courseId' | 'scopeLabel'>[];
  onChange: (filters: ReportV2FilterState) => void;
}

export function V2ReportsFilters({ filters, courseOptions, onChange }: Props) {
  return (
    <div className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-2 xl:grid-cols-[minmax(210px,1.25fr)_repeat(5,minmax(125px,0.65fr))]">
      <label className="relative">
        <span className="sr-only">Buscar reportes</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} placeholder="Buscar reporte o alcance" className="pl-9" />
      </label>
      <Select value={filters.category} onValueChange={(category) => onChange({ ...filters, category: category as ReportV2FilterState['category'] })}>
        <SelectTrigger aria-label="Filtrar por categoría"><SelectValue placeholder="Categoría" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          <SelectItem value="attendance">Asistencia</SelectItem>
          <SelectItem value="performance">Rendimiento</SelectItem>
          <SelectItem value="risk">Riesgo</SelectItem>
          <SelectItem value="evaluations">Evaluaciones</SelectItem>
          <SelectItem value="materials">Materiales</SelectItem>
          <SelectItem value="activity">Actividad</SelectItem>
          <SelectItem value="progress">Progreso</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.courseId} onValueChange={(courseId) => onChange({ ...filters, courseId })}>
        <SelectTrigger aria-label="Filtrar por curso o sección"><SelectValue placeholder="Curso / sección" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los alcances</SelectItem>
          {courseOptions.map((option) => option.courseId ? <SelectItem key={option.courseId} value={option.courseId}>{option.scopeLabel}</SelectItem> : null)}
        </SelectContent>
      </Select>
      <Select value={filters.period} onValueChange={(period) => onChange({ ...filters, period: period as ReportV2FilterState['period'] })}>
        <SelectTrigger aria-label="Filtrar por período"><SelectValue placeholder="Período" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Todos los períodos</SelectItem><SelectItem value="current">Actual</SelectItem><SelectItem value="recent">Reciente</SelectItem><SelectItem value="previous">Anterior</SelectItem></SelectContent>
      </Select>
      <Select value={filters.status} onValueChange={(status) => onChange({ ...filters, status: status as ReportV2FilterState['status'] })}>
        <SelectTrigger aria-label="Filtrar por estado"><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Todos los estados</SelectItem><SelectItem value="available">Disponible</SelectItem><SelectItem value="review">En revisión</SelectItem><SelectItem value="scheduled">Programado</SelectItem></SelectContent>
      </Select>
      <Select value={filters.audience} onValueChange={(audience) => onChange({ ...filters, audience: audience as ReportV2FilterState['audience'] })}>
        <SelectTrigger aria-label="Filtrar por audiencia"><SelectValue placeholder="Audiencia" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Todas las audiencias</SelectItem><SelectItem value="institution">Institución</SelectItem><SelectItem value="course">Curso</SelectItem><SelectItem value="section">Sección</SelectItem></SelectContent>
      </Select>
    </div>
  );
}
