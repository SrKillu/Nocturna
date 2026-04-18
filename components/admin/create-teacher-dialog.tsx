'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Copy, Loader2, Plus, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/client';

const formSchema = z.object({
  fullName: z.string().trim().min(2, 'Mínimo 2 caracteres').max(200),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .refine((v) => v === '' || v.length >= 8, 'Mínimo 8 caracteres')
    .optional(),
});
type FormValues = z.infer<typeof formSchema>;

type Result = { id: string; email: string; temporaryPassword: string };

export function CreateTeacherDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(v: FormValues): Promise<void> {
    const res = await apiFetch('/api/admin/teachers', {
      method: 'POST',
      body: JSON.stringify({
        fullName: v.fullName,
        email: v.email.toLowerCase(),
        ...(v.password ? { password: v.password } : {}),
      }),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      data?: Result;
      error?: { message?: string };
    };
    if (!res.ok || !payload.data) {
      toast.error('No se pudo crear el profesor', {
        description: payload?.error?.message ?? `HTTP ${res.status}`,
      });
      return;
    }
    toast.success('Profesor creado');
    setResult(payload.data);
    reset();
    router.refresh();
  }

  async function copy(value: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado`);
    } catch {
      toast.error('No se pudo copiar');
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          setResult(null);
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Crear profesor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
            Nuevo profesor
          </DialogTitle>
          <DialogDescription>
            Se creará con rol <code className="rounded bg-muted px-1">teacher</code> dentro de tu
            institución. Si no indicas contraseña, generaremos una temporal.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-4 text-sm">
              <p className="font-medium text-foreground">
                Profesor creado. Compártele estas credenciales (solo se mostrarán una vez):
              </p>
              <dl className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="flex items-center gap-2 font-mono text-xs">
                    {result.email}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => copy(result.email, 'Email')}
                      aria-label="Copiar email"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Contraseña</dt>
                  <dd className="flex items-center gap-2 font-mono text-xs">
                    {result.temporaryPassword}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => copy(result.temporaryPassword, 'Contraseña')}
                      aria-label="Copiar contraseña"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </dd>
                </div>
              </dl>
            </div>
            <DialogFooter>
              <Button onClick={() => { setResult(null); setOpen(false); }}>
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                disabled={isSubmitting}
                autoComplete="off"
                aria-invalid={Boolean(errors.fullName)}
                {...register('fullName')}
              />
              {errors.fullName ? (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                disabled={isSubmitting}
                autoComplete="off"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
              {errors.email ? (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña (opcional)</Label>
              <Input
                id="password"
                type="text"
                disabled={isSubmitting}
                autoComplete="new-password"
                placeholder="Dejar en blanco para autogenerar"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password ? (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              ) : null}
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { reset(); setOpen(false); }}
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
                  'Crear profesor'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
