'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Route-group error boundary: catches errors thrown in any /dashboard,
 * /courses, /tasks, /submissions, /grades or /admin page and keeps the
 * sidebar shell intact (the parent layout still wraps this component).
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[dashboard:error]', error);
  }, [error]);

  return (
    <Card>
      <CardHeader className="flex flex-col items-center gap-3 text-center py-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" aria-hidden />
        </span>
        <CardTitle className="text-xl">Algo salió mal</CardTitle>
        <CardDescription className="max-w-md">
          No pudimos cargar esta sección. Puedes volver a intentarlo o regresar al panel.
          {error.digest ? (
            <span className="mt-1 block text-xs text-muted-foreground">
              Ref: <code>{error.digest}</code>
            </span>
          ) : null}
        </CardDescription>
        <div className="flex gap-2 pt-2">
          <Button onClick={() => reset()} size="sm">
            <RefreshCcw className="mr-1.5 h-4 w-4" /> Reintentar
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard">Ir al panel</Link>
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
