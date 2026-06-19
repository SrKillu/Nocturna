import { MessageSquareText } from 'lucide-react';

import type { MySpaceV2Feedback } from '@/lib/types/my-space-v2';

interface V2MyFeedbackPreviewProps {
  feedback: readonly MySpaceV2Feedback[];
}

export function V2MyFeedbackPreview({ feedback }: V2MyFeedbackPreviewProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="my-feedback-title">
      <div className="border-b px-4 py-3">
        <h2 id="my-feedback-title" className="flex items-center gap-2 font-semibold">
          <MessageSquareText className="h-4 w-4 text-primary" aria-hidden />
          Retroalimentación
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Comentarios académicos recientes de demostración.
        </p>
      </div>
      <ul className="divide-y">
        {feedback.map((item) => (
          <li key={item.id} className="px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{item.courseName}</p>
              <span className="text-xs text-muted-foreground">{item.dateLabel}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.comment}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
