import type { UserRole } from '@/lib/types/database';

export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'student':
      return 'Estudiante';
    case 'teacher':
      return 'Profesor';
    case 'admin':
      return 'Administrador';
    case 'super_admin':
      return 'Super Admin';
    default:
      return role;
  }
}
