'use client';

import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const LazyDialog = dynamic(
  () => import('./create-task-dialog').then((m) => m.CreateTaskDialog),
  {
    ssr: false,
    loading: () => (
      <Button size="sm" disabled>
        <Plus className="mr-1.5 h-4 w-4" /> Crear tarea
      </Button>
    ),
  }
);

interface CourseOption {
  id: string;
  name: string;
}

export function CreateTaskDialogLazy({ courses }: { courses: CourseOption[] }) {
  return <LazyDialog courses={courses} />;
}
