'use client';

import { useEffect } from 'react';
import { RefreshCcw, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function V2Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[dashboard:v2:error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-md border bg-card px-6 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-destructive/10 text-destructive">
        <TriangleAlert className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="text-xl font-semibold">No pudimos cargar el dashboard</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Vuelve a intentarlo. Si el problema continúa, regresa más tarde.
      </p>
      <Button type="button" className="mt-5" onClick={reset}>
        <RefreshCcw className="h-4 w-4" aria-hidden />
        Reintentar
      </Button>
    </div>
  );
}
