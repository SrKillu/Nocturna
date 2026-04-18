import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { AdminUsersClient } from './users-client';

export default async function AdminUsersPage() {
  await requireAuth();
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_active, created_at')
    .order('created_at', { ascending: false });
  return <AdminUsersClient initialUsers={(data ?? []) as UserRow[]} />;
}

export interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  is_active: boolean;
  created_at: string;
}
