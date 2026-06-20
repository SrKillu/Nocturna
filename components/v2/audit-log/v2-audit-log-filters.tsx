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
  AuditLogV2Event,
  AuditLogV2FilterState,
} from '@/lib/types/audit-log-v2';

interface V2AuditLogFiltersProps {
  filters: AuditLogV2FilterState;
  actorOptions: readonly Pick<AuditLogV2Event, 'actorId' | 'actorLabel'>[];
  onChange: (filters: AuditLogV2FilterState) => void;
}

export function V2AuditLogFilters({
  filters,
  actorOptions,
  onChange,
}: V2AuditLogFiltersProps) {
  return (
    <div className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-2 xl:grid-cols-[minmax(200px,1.2fr)_repeat(6,minmax(118px,0.65fr))]">
      <label className="relative">
        <span className="sr-only">Buscar eventos</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} placeholder="Buscar evento" className="pl-9" />
      </label>
      <Select value={filters.module} onValueChange={(module) => onChange({ ...filters, module: module as AuditLogV2FilterState['module'] })}>
        <SelectTrigger aria-label="Filtrar por módulo"><SelectValue placeholder="Módulo" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Módulos</SelectItem><SelectItem value="auth">Auth</SelectItem><SelectItem value="settings">Settings</SelectItem><SelectItem value="staff">Staff</SelectItem><SelectItem value="students">Students</SelectItem><SelectItem value="courses">Courses</SelectItem><SelectItem value="enrollments">Enrollments</SelectItem><SelectItem value="reports">Reports</SelectItem><SelectItem value="certificates">Certificates</SelectItem><SelectItem value="library">Library</SelectItem></SelectContent>
      </Select>
      <Select value={filters.eventType} onValueChange={(eventType) => onChange({ ...filters, eventType: eventType as AuditLogV2FilterState['eventType'] })}>
        <SelectTrigger aria-label="Filtrar por tipo"><SelectValue placeholder="Tipo" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Tipos</SelectItem><SelectItem value="sign-in">Inicio de sesión</SelectItem><SelectItem value="settings-change">Configuración</SelectItem><SelectItem value="role-change">Rol</SelectItem><SelectItem value="academic-update">Académico</SelectItem><SelectItem value="denied-attempt">Denegado</SelectItem><SelectItem value="simulated-export">Exportación simulada</SelectItem><SelectItem value="admin-action">Administrativa</SelectItem><SelectItem value="membership-change">Membresía</SelectItem></SelectContent>
      </Select>
      <Select value={filters.severity} onValueChange={(severity) => onChange({ ...filters, severity: severity as AuditLogV2FilterState['severity'] })}>
        <SelectTrigger aria-label="Filtrar por severidad"><SelectValue placeholder="Severidad" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Severidades</SelectItem><SelectItem value="info">Informativa</SelectItem><SelectItem value="notice">Atención</SelectItem><SelectItem value="warning">Advertencia</SelectItem><SelectItem value="critical">Crítica</SelectItem></SelectContent>
      </Select>
      <Select value={filters.status} onValueChange={(status) => onChange({ ...filters, status: status as AuditLogV2FilterState['status'] })}>
        <SelectTrigger aria-label="Filtrar por estado"><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Estados</SelectItem><SelectItem value="recorded">Registrado</SelectItem><SelectItem value="review">En revisión</SelectItem><SelectItem value="resolved">Resuelto</SelectItem></SelectContent>
      </Select>
      <Select value={filters.actorId} onValueChange={(actorId) => onChange({ ...filters, actorId })}>
        <SelectTrigger aria-label="Filtrar por actor"><SelectValue placeholder="Actor" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Actores</SelectItem>{actorOptions.map((actor) => <SelectItem key={actor.actorId} value={actor.actorId}>{actor.actorLabel}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={filters.period} onValueChange={(period) => onChange({ ...filters, period: period as AuditLogV2FilterState['period'] })}>
        <SelectTrigger aria-label="Filtrar por período"><SelectValue placeholder="Período" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Períodos</SelectItem><SelectItem value="today">Hoy</SelectItem><SelectItem value="week">Semana</SelectItem><SelectItem value="month">Mes</SelectItem><SelectItem value="previous">Anterior</SelectItem></SelectContent>
      </Select>
    </div>
  );
}
