'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Plus } from 'lucide-react';
import type { CourseRow, TeacherRow } from './page';

export function AdminCoursesClient({
  initialCourses,
  teachers,
}: {
  initialCourses: CourseRow[];
  teachers: TeacherRow[];
}) {
  const router = useRouter();
  const [courses] = useState(initialCourses);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teacherId, setTeacherId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          teacherId: teacherId || null,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload?.error?.message ?? 'Error al crear el curso');
        return;
      }
      toast.success('Curso creado');
      setName('');
      setDescription('');
      setTeacherId('');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cursos</h1>
        <p className="text-sm text-muted-foreground">
          Crea y administra los cursos de tu institución.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" /> Nuevo curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="course-name">Nombre</Label>
              <Input
                id="course-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Matemáticas I"
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="course-description">Descripción</Label>
              <Textarea
                id="course-description"
                rows={1}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label>Profesor</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder={teachers.length ? 'Selecciona un profesor' : 'Sin profesores aún'} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.full_name ?? t.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creando…' : 'Crear curso'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" /> Cursos existentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {courses.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Todavía no hay cursos. Crea el primero arriba.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Profesor</TableHead>
                  <TableHead>Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      {c.teacher ? c.teacher.full_name ?? c.teacher.email : (
                        <span className="text-muted-foreground">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(c.created_at).toLocaleDateString('es')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
