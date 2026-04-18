import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/api/auth';

export default async function DashboardIndex() {
  const ctx = await requireAuth();
  if (ctx.role === 'admin' || ctx.role === 'super_admin') {
    redirect('/dashboard/admin');
  }
  if (ctx.role === 'teacher') {
    redirect('/dashboard/teacher');
  }
  redirect('/dashboard/student');
}
