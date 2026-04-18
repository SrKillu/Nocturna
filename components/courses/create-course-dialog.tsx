'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiFetch } from '@/lib/api/client';
import { createCourseSchema, type CreateCourseInput } from '@/lib/validations/courses';

interface Teacher {
  id: string;
  full_name: string | null;
  email: string;
}

const UNASSIGNED = '__unassigned__';

export function CreateCourseDialog({
  teachers,
  canAssignTeacher = true,
}: {
  teachers: Teacher[];
  canAssignTeacher?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: { name: '', description: '', teacherId: null },
    mode: 'onSubmit',
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: CreateCourseInput): Promise<void> {
    const payload = {
      ...values,
      description: values.description?.trim() ? values.description : null,
      teacherId: values.teacherId ?? null,
    };
    const res = await apiFetch('/api/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    if (!res.ok) {
      toast.error('No se pudo crear el curso', {
        description: body?.error?.message ?? `HTTP ${res.status}`,
      });
      return;
    }
    toast.success('Curso creado');
    reset();
    setOpen(false);
    router.refresh();
  }

  const selectedTeacher = watch('teacherId') ?? UNASSIGNED;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Crear curso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo curso</DialogTitle>
          <DialogDescription>
            El curso será visible para toda tu institución. Puedes asignarle un
            profesor ahora o más adelante.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              autoComplete="off"
              placeholder="Ej. Matemática I"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            {errors.name ? (
              <p className="text-xs text-destructive">Introduce un nombre (2–140 caracteres).</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Resumen visible para alumnos y profesores."
              disabled={isSubmitting}
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacherId">Profesor asignado</Label>
            {canAssignTeacher ? (
              <>
                <Select
                  value={selectedTeacher}
                  onValueChange={(v) => setValue('teacherId', v === UNASSIGNED ? null : v)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="teacherId">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Sin asignar</SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.full_name?.trim() || t.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {teachers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No hay profesores registrados todavía. Puedes crearlo sin asignar y enlazarlo
                    después.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Serás el profesor asignado a este curso.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando…
                </>
              ) : (
                'Crear curso'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
