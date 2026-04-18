import Link from 'next/link';
import { Ghost } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Dashboard-local 404. Renders inside the authenticated shell so users keep
 * the sidebar and can navigate away without landing on an empty page.
 */
export default function NotFound() {
  return (
    <Card>
      <CardHeader className="flex flex-col items-center gap-3 text-center py-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Ghost className="h-6 w-6" aria-hidden />
        </span>
        <CardTitle className="text-xl">No encontramos lo que buscabas</CardTitle>
        <CardDescription className="max-w-md">
          La página a la que intentabas acceder no existe o no tienes permiso para verla.
        </CardDescription>
        <Button asChild size="sm" className="mt-2">
          <Link href="/dashboard">Volver al panel</Link>
        </Button>
      </CardHeader>
    </Card>
  );
}
