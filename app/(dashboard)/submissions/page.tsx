import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyModule } from '@/components/layout/empty-module';

export const metadata: Metadata = {
  title: 'Entregas · Nocturna',
};

export default function SubmissionsPage() {
  return (
    <>
      <PageHeader
        title="Entregas"
        description="Envíos y estado de las tareas."
      />
      <EmptyModule
        title="Módulo de entregas"
        description="Próximamente: subida segura, listado por tarea/estudiante y estado de revisión."
      />
    </>
  );
}
