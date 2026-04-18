import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Moon, ShieldCheck, Database, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-accent/30">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Moon className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Nocturna</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost">Iniciar sesión</Button>
          </Link>
          <Link href="/signup">
            <Button>Crear institución</Button>
          </Link>
        </nav>
      </header>

      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" /> Multi-tenant · Row Level Security
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            La plataforma académica de tu
            <span className="block bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">
              institución, aislada y segura.
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Crea tu institución en segundos, invita profesores y estudiantes, y gestiona cursos, tareas y
            calificaciones con aislamiento absoluto por tenant.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="min-w-48">
                Crear mi institución
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="min-w-48">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Aislamiento por tenant"
            description="Cada institución opera en su propio espacio. RLS de Postgres + claims en JWT garantizan aislamiento absoluto."
          />
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="Roles nítidos"
            description="student, teacher, admin y super_admin. Permisos forzados tanto en el backend como en el middleware."
          />
          <FeatureCard
            icon={<Database className="h-5 w-5" />}
            title="Supabase nativo"
            description="Auth, Postgres y Storage de Supabase con validación Zod en todos los endpoints."
          />
        </div>
      </section>

      <footer className="border-t">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Nocturna · Plataforma académica multi-tenant
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-muted/70 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
