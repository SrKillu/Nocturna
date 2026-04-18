'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SubmissionStatus } from '@/lib/types/database';

const ALL = '__all__';
const OPTIONS: Array<{ value: SubmissionStatus; label: string }> = [
  { value: 'submitted', label: 'Enviadas' },
  { value: 'graded', label: 'Calificadas' },
  { value: 'late', label: 'Tarde' },
  { value: 'returned', label: 'Devueltas' },
];

export function SubmissionStatusFilter({
  selectedStatus,
}: {
  selectedStatus: SubmissionStatus | null;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(next: string): void {
    const url = new URLSearchParams(params.toString());
    if (next === ALL) url.delete('status');
    else url.set('status', next);
    router.push(`/submissions${url.toString() ? `?${url.toString()}` : ''}`);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">Filtrar por estado</p>
      <div className="w-full max-w-xs">
        <Select value={selectedStatus ?? ALL} onValueChange={onChange}>
          <SelectTrigger aria-label="Estado">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los estados</SelectItem>
            {OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
