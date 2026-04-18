import { GraduationCap, User2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { CoursePerson } from '@/lib/services/courses.service';

function initials(person: CoursePerson): string {
  const src = person.full_name?.trim() || person.email;
  const parts = src.split(/\s+|@/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function CoursePeople({ people }: { people: CoursePerson[] }) {
  const teachers = people.filter((p) => p.role === 'teacher');
  const students = people.filter((p) => p.role === 'student');

  return (
    <div className="space-y-4">
      <PeopleSection
        title="Profesor·a"
        description="Responsable del curso."
        people={teachers}
        icon={<GraduationCap className="h-4 w-4" />}
        emptyText="Sin profesor asignado todavía."
      />
      <PeopleSection
        title="Estudiantes"
        description={`${students.length} matriculado·as en el curso.`}
        people={students}
        icon={<User2 className="h-4 w-4" />}
        emptyText="Todavía no hay estudiantes matriculados."
      />
    </div>
  );
}

function PeopleSection({
  title,
  description,
  people,
  icon,
  emptyText,
}: {
  title: string;
  description: string;
  people: CoursePerson[];
  icon: React.ReactNode;
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {icon}
          </span>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {people.length === 0 ? (
          <p className="rounded-md border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          <ul className="divide-y">
            {people.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">{initials(p)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {p.full_name?.trim() || p.email.split('@')[0]}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
