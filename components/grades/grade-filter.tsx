'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function GradeFilter({ onlyPending }: { onlyPending: boolean }) {
  const router = useRouter();
  const params = useSearchParams();

  function go(pending: boolean): void {
    const url = new URLSearchParams(params.toString());
    if (pending) url.set('pending', '1');
    else url.delete('pending');
    router.push(`/grades${url.toString() ? `?${url.toString()}` : ''}`);
  }

  return (
    <div className="inline-flex rounded-lg border bg-card p-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn('h-8 px-3', !onlyPending && 'bg-muted text-foreground')}
        onClick={() => go(false)}
      >
        Todas
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn('h-8 px-3', onlyPending && 'bg-muted text-foreground')}
        onClick={() => go(true)}
      >
        Solo pendientes
      </Button>
    </div>
  );
}
