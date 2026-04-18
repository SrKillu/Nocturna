'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus } from 'lucide-react';
import type { UserRow } from './page';

const ROLE_LABEL: Record<UserRow['role'], string> = {
  student: 'Estudiante',
  teacher: 'Profesor',
  admin: 'Administrador',
  super_admin: 'Super Admin',
};

export function AdminUsersClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [loading, setLoading] = useState(false);
  const [lastTempPassword, setLastTempPassword] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const activeCount = useMemo(() => users.filter((u) => u.is_active).length, [users]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/institution/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, fullName, role }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload?.error?.message ?? 'Error al invitar usuario');
        return;
      }
      toast.success('Usuario creado');
      setLastTempPassword(payload.data.temporaryPassword);
      setEmail('');
      setFullName('');
      setRole('student');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function patchUser(
    userId: string,
    patch: { role?: UserRow['role']; isActive?: boolean }
  ) {
    setRowBusy(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload?.error?.message ?? 'Error al actualizar usuario');
        return;
      }
      toast.success('Usuario actualizado. Sus sesiones activas fueron invalidadas.');
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                role: (payload.data.role as UserRow['role']) ?? u.role,
                is_active:
                  typeof payload.data.isActive === 'boolean' ? payload.data.isActive : u.is_active,
              }
            : u
        )
      );
    } finally {
      setRowBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Invita miembros y gestiona acceso. Los cambios de rol o estado invalidan las sesiones activas del usuario.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" /> Invitar usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={invite} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-1">
              <Label>Nombre</Label>
              <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Correo</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'student' | 'teacher' | 'admin')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Estudiante</SelectItem>
                  <SelectItem value="teacher">Profesor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creando…' : 'Crear usuario'}
              </Button>
            </div>
          </form>
          {lastTempPassword && (
            <div className="mt-4 rounded-lg border border-primary/30 bg-accent p-4 text-sm">
              <p className="font-medium">Contraseña temporal generada</p>
              <p className="mt-1 font-mono text-base">{lastTempPassword}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Comparte esta contraseña de forma segura. No se volverá a mostrar.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Miembros ({users.length}) · Activos {activeCount}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name ?? '—'}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role === 'super_admin' ? 'super_admin' : u.role}
                      onValueChange={(v) => {
                        if (v === u.role || v === 'super_admin') return;
                        patchUser(u.id, { role: v as UserRow['role'] });
                      }}
                      disabled={rowBusy === u.id || u.role === 'super_admin'}
                    >
                      <SelectTrigger className="h-8 w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">{ROLE_LABEL.student}</SelectItem>
                        <SelectItem value="teacher">{ROLE_LABEL.teacher}</SelectItem>
                        <SelectItem value="admin">{ROLE_LABEL.admin}</SelectItem>
                        {u.role === 'super_admin' && (
                          <SelectItem value="super_admin" disabled>
                            {ROLE_LABEL.super_admin}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={u.is_active}
                        disabled={rowBusy === u.id}
                        onCheckedChange={(checked: boolean) => patchUser(u.id, { isActive: checked })}
                      />
                      <Badge variant={u.is_active ? 'default' : 'secondary'}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString('es')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
