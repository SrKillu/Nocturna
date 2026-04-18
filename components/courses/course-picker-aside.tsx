'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export interface PickerCourse {
  id: string;
  name: string;
}

interface Props {
  courses: PickerCourse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyHint?: string;
}

/**
 * Lista de cursos “aside” reutilizable (materiales / chat / invitaciones).
 *   * Sincroniza la selección en la URL `?courseId=...` (SP-friendly).
 *   * Filtro local sin llamada extra al servidor.
 */
export function CoursePickerAside({ courses, selectedId, onSelect, emptyHint }: Props) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => c.name.toLowerCase().includes(q));
  }, [courses, query]);

  useEffect(() => {
    if (!selectedId && courses.length > 0) {
      onSelect(courses[0].id);
    }
  }, [courses, selectedId, onSelect]);

  function handleSelect(id: string) {
    onSelect(id);
    // Refleja en la URL sin recargar.
    const sp = new URLSearchParams();
    sp.set('courseId', id);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-md border bg-card">
      <div className="border-b p-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar curso…"
            className="pl-8 h-9"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">
          {emptyHint ?? 'No hay cursos disponibles.'}
        </p>
      ) : (
        <ul className="flex-1 divide-y overflow-y-auto">
          {filtered.map((c) => {
            const active = c.id === selectedId;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition-colors',
                    active
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'hover:bg-muted/60'
                  )}
                >
                  <span className="truncate">{c.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
