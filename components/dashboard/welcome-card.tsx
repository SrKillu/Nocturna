import { Card } from '@/components/ui/card';
import type { UserRole } from '@/lib/types/database';
import { roleLabel } from '@/lib/rbac/labels';

interface WelcomeCardProps {
  name: string;
  role: UserRole;
  institutionName: string | null;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Buenas noches';
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function WelcomeCard({ name, role, institutionName }: WelcomeCardProps) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8">
      <div className="relative z-10 max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">
          {roleLabel(role)}
          {institutionName ? ` · ${institutionName}` : ''}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
          {greeting()}, {name}.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Aquí tienes un resumen rápido de tu actividad académica. Los datos se
          refrescan cada vez que vuelves a esta vista.
        </p>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
      />
    </Card>
  );
}
