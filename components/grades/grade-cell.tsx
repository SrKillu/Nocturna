'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/client';

interface GradeCellProps {
  submissionId: string;
  maxScore: number;
  initialScore: number | null;
  initialFeedback: string | null;
}

/**
 * Inline score + feedback editor for a single submission.
 * Calls POST /api/submissions/:id/grade which maps to the transactional
 * RPC grade_submission (upsert grade + flip status + audit_log).
 */
export function GradeCell({
  submissionId,
  maxScore,
  initialScore,
  initialFeedback,
}: GradeCellProps) {
  const router = useRouter();
  const [score, setScore] = useState<string>(
    initialScore !== null ? String(initialScore) : ''
  );
  const [feedback, setFeedback] = useState<string>(initialFeedback ?? '');
  const [saving, setSaving] = useState(false);

  async function save(): Promise<void> {
    const n = Number(score);
    if (Number.isNaN(n) || n < 0 || n > maxScore) {
      toast.error('Nota inválida', {
        description: `Introduce un número entre 0 y ${maxScore}.`,
      });
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch(`/api/submissions/${submissionId}/grade`, {
        method: 'POST',
        body: JSON.stringify({
          score: n,
          feedback: feedback.trim() ? feedback.trim() : null,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!res.ok) {
        toast.error('No se pudo guardar la nota', {
          description: body?.error?.message ?? `HTTP ${res.status}`,
        });
        return;
      }
      toast.success('Calificación guardada');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={maxScore}
          step={1}
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="0"
          disabled={saving}
          aria-label="Nota"
          className="h-9 w-20 text-right tabular-nums"
        />
        <span className="text-sm text-muted-foreground">/ {maxScore}</span>
        <Button type="button" size="sm" onClick={save} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Guardando
            </>
          ) : (
            <>
              <Save className="mr-1.5 h-3.5 w-3.5" /> Guardar
            </>
          )}
        </Button>
      </div>
      <Textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={2}
        placeholder="Feedback (opcional)"
        disabled={saving}
        className="text-xs"
      />
    </div>
  );
}
