'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

/**
 * Client-side form schema — intentionally narrower than the API schema so we
 * can accept `<input type="datetime-local">` values and optional blank fields
 * without crashing Zod. We convert to the API payload right before sending.
 */
const formSchema = z.object({
  courseId: z.string().uuid({ message: 'Selecciona un curso' }),
  title: z.string().trim().min(2, 'Mínimo 2 caracteres').max(200),
  description: z.string().trim().max(5000).optional(),
  dueDate: z.string().optional(),
  maxScore: z.coerce.number().int().min(1).max(1000),
});
type FormValues = z.infer<typeof formSchema>;

interface CreateTaskDialogProps {
  courses: Array<{ id: string; name: string }>;
}

export function CreateTaskDialog({ courses }: CreateTaskDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: '',
      title: '',
      description: '',
      dueDate: '',
      maxScore: 100,
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: FormValues): Promise<void> {
    const payload = {
      courseId: values.courseId,
      title: values.title,
      description: values.description?.trim() ? values.description : null,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      maxScore: values.maxScore,
    };
    const res = await apiFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    if (!res.ok) {
      toast.error('No se pudo crear la tarea', {
        description: body?.error?.message ?? `HTTP ${res.status}`,
      });
      return;
    }
    toast.success('Tarea creada');
    reset();
    setOpen(false);
    router.refresh();
  }

  const disabled = courses.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled} title={disabled ? 'Necesitas un curso asignado' : undefined}>
          <Plus className="mr-1.5 h-4 w-4" /> Crear tarea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
          <DialogDescription>
            Las tareas se asocian a un curso y quedan visibles para sus estudiantes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="courseId">Curso</Label>
            <Select
              value={watch('courseId')}
              onValueChange={(v) => setValue('courseId', v, { shouldValidate: true })}
              disabled={isSubmitting}
            >
              <SelectTrigger id="courseId" aria-invalid={Boolean(errors.courseId)}>
                <SelectValue placeholder="Selecciona un curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.courseId ? (
              <p className="text-xs text-destructive">{errors.courseId.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              autoComplete="off"
              placeholder="Ej. Ensayo sobre polinomios"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.title)}
              {...register('title')}
            />
            {errors.title ? (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Enunciado (opcional)</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Describe los requisitos, rubrica, recursos, etc."
              disabled={isSubmitting}
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha de entrega (opcional)</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                disabled={isSubmitting}
                {...register('dueDate')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxScore">Puntaje máximo</Label>
              <Input
                id="maxScore"
                type="number"
                min={1}
                max={1000}
                step={1}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.maxScore)}
                {...register('maxScore', { valueAsNumber: true })}
              />
              {errors.maxScore ? (
                <p className="text-xs text-destructive">Valor entre 1 y 1000.</p>
              ) : null}
            </div>
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
                'Crear tarea'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
