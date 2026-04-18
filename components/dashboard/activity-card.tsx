import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Activity,
  BookOpenCheck,
  FileUp,
  LogIn,
  LogOut,
  ShieldCheck,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityItem } from '@/lib/services/dashboard.service';
import { formatRelativeDate } from '@/lib/utils/date';

interface ActivityCardProps {
  items: ActivityItem[];
}

export function ActivityCard({ items }: ActivityCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Actividad reciente</CardTitle>
        <CardDescription>Últimos eventos registrados en tu institución.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-4 py-8 text-center">
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Activity className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm font-medium">Sin actividad aún</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Las acciones relevantes (calificaciones, subidas, inicios de sesión) se
              listarán aquí a medida que ocurran.
            </p>
          </div>
        ) : (
          <ol className="relative space-y-4">
            {items.map((item) => {
              const { Icon, label } = describe(item.action);
              return (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{item.actor_name ?? 'Alguien'}</span>{' '}
                      <span className="text-muted-foreground">{label}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeDate(item.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function describe(action: string): { Icon: LucideIcon; label: string } {
  switch (action) {
    case 'grade.upsert':
      return { Icon: BookOpenCheck, label: 'registró una calificación' };
    case 'file.upload_url.issued':
      return { Icon: FileUp, label: 'subió un archivo' };
    case 'file.confirm':
      return { Icon: FileUp, label: 'confirmó una entrega' };
    case 'user.invite':
      return { Icon: UserPlus, label: 'invitó a un usuario' };
    case 'session.invalidate':
      return { Icon: ShieldCheck, label: 'revocó una sesión' };
    case 'login_success':
      return { Icon: LogIn, label: 'inició sesión' };
    case 'logout':
      return { Icon: LogOut, label: 'cerró sesión' };
    default:
      return { Icon: Activity, label: action.replaceAll('.', ' → ') };
  }
}
