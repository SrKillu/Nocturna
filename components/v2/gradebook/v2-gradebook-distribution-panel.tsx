import { BarChart3 } from 'lucide-react';

import type { GradebookV2DistributionItem } from '@/lib/types/gradebook-v2';

export function V2GradebookDistributionPanel({
  distribution,
}: {
  distribution: readonly GradebookV2DistributionItem[];
}) {
  const total = distribution.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="rounded-md border bg-card" aria-labelledby="grade-distribution-title">
      <div className="border-b px-4 py-3">
        <h2 id="grade-distribution-title" className="flex items-center gap-2 font-semibold">
          <BarChart3 className="h-4 w-4 text-primary" aria-hidden />
          Distribución mock
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Agrupación ilustrativa, no oficial.
        </p>
      </div>
      <ul className="space-y-4 p-4">
        {distribution.map((item) => {
          const percentage = total === 0 ? 0 : Math.round((item.count / total) * 100);
          return (
            <li key={item.range}>
              <div className="flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {item.count} · {percentage}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
