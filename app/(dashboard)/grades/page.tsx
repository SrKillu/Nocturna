import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyModule } from '@/components/layout/empty-module';

export const metadata: Metadata = {
  title: 'Calificaciones · Nocturna',
};

export default function GradesPage() {
  return (
    <>
      <PageHeader
        title="Calificaciones"
        description="Histórico de calificaciones y feedback."
      />
      <EmptyModule
        title="Módulo de calificaciones"
        description="Próximamente: calificar entregas, revertir y ver histórico por curso."
      />
    </>
  );
}
