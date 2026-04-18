import { Sparkles } from 'lucide-react';

interface EmptyModuleProps {
  title: string;
  description: string;
}

/**
 * Neutral placeholder shown by modules that haven’t been implemented yet.
 * Centralised so the next prompts can swap them out without touching copy.
 */
export function EmptyModule({ title, description }: EmptyModuleProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-5 w-5" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
