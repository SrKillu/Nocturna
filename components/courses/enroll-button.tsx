'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/client';

/**
 * Self-enrolment CTA for students. Posts to the existing
 * POST /api/courses/:id/enroll endpoint which enforces role rules and RLS.
 */
export function EnrollButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function enroll(): Promise<void> {
    if (loading) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: { code?: string; message?: string };
      };
      if (!res.ok) {
        const msg = body?.error?.message ?? `HTTP ${res.status}`;
        toast.error('No pudimos matricularte', { description: msg });
        return;
      }
      toast.success('Matriculado correctamente');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={enroll} size="sm" disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Matriculando…
        </>
      ) : (
        <>
          <UserPlus className="mr-1.5 h-4 w-4" /> Matricularme
        </>
      )}
    </Button>
  );
}
