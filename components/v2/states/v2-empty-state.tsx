import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface V2EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function V2EmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: V2EmptyStateProps) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 px-6 py-8 text-center">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-md border bg-background text-muted-foreground">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
