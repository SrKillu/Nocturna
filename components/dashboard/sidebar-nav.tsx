'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  ClipboardList,
} from 'lucide-react';
import type { UserRole } from '@/lib/types/database';

interface Item {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function SidebarNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items: Item[] = navFor(role);

  return (
    <nav className="px-3 pb-6">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function navFor(role: UserRole): Item[] {
  if (role === 'admin' || role === 'super_admin') {
    return [
      { href: '/dashboard/admin', label: 'Resumen', icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: '/dashboard/admin/courses', label: 'Cursos', icon: <BookOpen className="h-4 w-4" /> },
      { href: '/dashboard/admin/users', label: 'Usuarios', icon: <Users className="h-4 w-4" /> },
    ];
  }
  if (role === 'teacher') {
    return [
      { href: '/dashboard/teacher', label: 'Mis cursos', icon: <BookOpen className="h-4 w-4" /> },
    ];
  }
  return [
    { href: '/dashboard/student', label: 'Mis cursos', icon: <GraduationCap className="h-4 w-4" /> },
    { href: '/dashboard/student/tasks', label: 'Mis tareas', icon: <ClipboardList className="h-4 w-4" /> },
  ];
}
