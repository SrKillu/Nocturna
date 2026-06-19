import { NotebookText } from 'lucide-react';

import type { StudentV2NotePreview } from '@/lib/types/students-v2';

interface V2StudentNotesPreviewProps {
  notes: readonly StudentV2NotePreview[];
}

export function V2StudentNotesPreview({ notes }: V2StudentNotesPreviewProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="student-notes-title">
      <div className="border-b px-4 py-3">
        <h2 id="student-notes-title" className="flex items-center gap-2 font-semibold">
          <NotebookText className="h-4 w-4 text-primary" aria-hidden />
          Notas y observaciones
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Registros informativos de demostración.
        </p>
      </div>
      <ul className="divide-y">
        {notes.map((note) => (
          <li key={note.id} className="px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{note.title}</p>
              <span className="text-xs text-muted-foreground">{note.dateLabel}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{note.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
