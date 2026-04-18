import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyModule } from '@/components/layout/empty-module';

export const metadata: Metadata = {
  title: 'Cursos · Nocturna',
};

export default function CoursesPage() {
  return (
    <>
      <PageHeader
        title="Cursos"
        description="Todos los cursos de tu institución a los que tienes acceso."
      />
      <EmptyModule
        title="Módulo de cursos"
        description="Aquí aparecerá el listado y la gestión de cursos. Se implementará en el siguiente prompt."
      />
    </>
  );
}
