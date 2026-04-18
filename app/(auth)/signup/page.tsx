'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    institutionName: '',
    institutionSlug: '',
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload?.error?.message ?? 'No se pudo crear la institución');
        return;
      }
      toast.success('Institución creada. Iniciando sesión…');
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: form.adminEmail,
        password: form.adminPassword,
      });
      if (error) {
        toast.error('Institución creada, pero falló el inicio de sesión automático', {
          description: error.message,
        });
        router.push('/login');
        return;
      }
      router.replace('/dashboard');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-accent/30 px-4 py-10">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Moon className="h-4 w-4" />
          </span>
          Nocturna
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Crea tu institución</CardTitle>
            <CardDescription>
              Tú serás el administrador inicial. Podrás invitar profesores y estudiantes después.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="institutionName">Nombre de la institución</Label>
                  <Input
                    id="institutionName"
                    required
                    minLength={2}
                    value={form.institutionName}
                    onChange={(e) => update('institutionName', e.target.value)}
                    placeholder="Colegio Santa Ana"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institutionSlug">Identificador</Label>
                  <Input
                    id="institutionSlug"
                    required
                    minLength={3}
                    pattern="[a-z0-9-]+"
                    value={form.institutionSlug}
                    onChange={(e) => update('institutionSlug', e.target.value.toLowerCase())}
                    placeholder="santa-ana"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminFullName">Tu nombre completo</Label>
                <Input
                  id="adminFullName"
                  required
                  minLength={2}
                  value={form.adminFullName}
                  onChange={(e) => update('adminFullName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Correo del administrador</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  required
                  value={form.adminEmail}
                  onChange={(e) => update('adminEmail', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Contraseña</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  required
                  minLength={8}
                  value={form.adminPassword}
                  onChange={(e) => update('adminPassword', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creando…' : 'Crear institución'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
