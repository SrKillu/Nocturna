/**
 * T14 · Race conditions (simulated).
 *
 * The DB-level guarantee lives in `grade_submission` RPC:
 *   insert ... on conflict (submission_id) do update ...
 * Postgres serialises that on the unique index, so two concurrent callers
 * trying to grade the same submission converge on a single row without
 * duplicates. We simulate that semantic here with a mocked store, then the
 * E2E suite re-verifies it against a real database.
 */

import { describe, it, expect, vi } from 'vitest';
import { ApiError } from '@/lib/errors';

interface Grade {
  submissionId: string;
  teacherId: string;
  score: number;
}

/** In-test simulation of the RPC: unique on submissionId, upsert semantics. */
function createGradeStore(): {
  upsert: (g: Grade) => Promise<Grade>;
  all: () => Grade[];
} {
  const store = new Map<string, Grade>();
  const locks = new Map<string, Promise<void>>();
  async function withLock(key: string, fn: () => Promise<void>): Promise<void> {
    const prev = locks.get(key) ?? Promise.resolve();
    let release!: () => void;
    const next = new Promise<void>((r) => (release = r));
    locks.set(
      key,
      prev.then(async () => {
        try {
          await fn();
        } finally {
          release();
        }
      })
    );
    await locks.get(key);
    void next;
  }
  return {
    async upsert(g) {
      await withLock(g.submissionId, async () => {
        store.set(g.submissionId, g);
      });
      return store.get(g.submissionId)!;
    },
    all: () => Array.from(store.values()),
  };
}

describe('T14 · race conditions', () => {
  it('20 concurrent upserts on the same submissionId produce exactly 1 row', async () => {
    const store = createGradeStore();
    const subId = 'sub-1';
    const calls = Array.from({ length: 20 }, (_, i) =>
      store.upsert({ submissionId: subId, teacherId: 't1', score: i })
    );
    await Promise.all(calls);
    expect(store.all().filter((g) => g.submissionId === subId)).toHaveLength(1);
  });

  it('concurrent upserts on distinct submissionIds do not interfere', async () => {
    const store = createGradeStore();
    const calls = Array.from({ length: 50 }, (_, i) =>
      store.upsert({ submissionId: `sub-${i}`, teacherId: 't1', score: 7 })
    );
    await Promise.all(calls);
    expect(store.all()).toHaveLength(50);
  });

  it('maps Postgres error codes to stable ApiError codes', async () => {
    const { gradeSubmission } = await import('@/lib/services/grades.service');

    // Dynamically mock createClient for this test only.
    const serverModule = await import('@/lib/supabase/server');
    const spy = vi.spyOn(serverModule, 'createClient');

    const cases: Array<{ pg: string; api: string }> = [
      { pg: 'P0002', api: 'NOT_FOUND' },
      { pg: '42501', api: 'FORBIDDEN' },
      { pg: '22023', api: 'VALIDATION_ERROR' },
    ];

    for (const c of cases) {
      spy.mockReturnValueOnce({
        rpc: async () => ({ data: null, error: { code: c.pg, message: 'x' } }),
      } as unknown as ReturnType<typeof serverModule.createClient>);

      try {
        await gradeSubmission(
          {
            user: { id: 'u' } as never,
            userId: 'u',
            role: 'teacher',
            institutionId: 'i',
            email: 'e',
          },
          'sub-1',
          { score: 5, feedback: null }
        );
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).code).toBe(c.api);
      }
    }

    spy.mockRestore();
  });

  it('refuses to grade when caller role is not teacher/admin', async () => {
    const { gradeSubmission } = await import('@/lib/services/grades.service');
    await expect(
      gradeSubmission(
        {
          user: { id: 'u' } as never,
          userId: 'u',
          role: 'student',
          institutionId: 'i',
          email: 'e',
        },
        'sub-1',
        { score: 5, feedback: null }
      )
    ).rejects.toThrow(/teachers/i);
  });
});
