'use client';

import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

/**
 * Lazy loader for the CreateCourseDialog.
 *
 * The dialog carries its own react-hook-form + Zod + shadcn Dialog payload
 * (≈ 45 kB gzipped). 95% of visits to /courses never open it, so we defer
 * the module load until the user actually clicks the trigger.
 */
const LazyDialog = dynamic(
  () => import('./create-course-dialog').then((m) => m.CreateCourseDialog),
  {
    ssr: false,
    loading: () => (
      <Button size="sm" disabled>
        <Plus className="mr-1.5 h-4 w-4" /> Crear curso
      </Button>
    ),
  }
);

interface Teacher {
  id: string;
  full_name: string | null;
  email: string;
}

export function CreateCourseDialogLazy({ teachers }: { teachers: Teacher[] }) {
  return <LazyDialog teachers={teachers} />;
}
