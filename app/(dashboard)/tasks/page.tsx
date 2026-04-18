import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyModule } from '@/components/layout/empty-module';

export const metadata: Metadata = {
  title: 'Tareas · Nocturna',
};

export default function TasksPage() {
  return (
    <>
      <PageHeader
        title="Tareas"
        description="Creación y seguimiento de tareas asignadas a cursos."
      />
      <EmptyModule
        title="Módulo de tareas"
        description="Próximamente: listado, creación y asignación de tareas."
      />
    </>
  );
}
