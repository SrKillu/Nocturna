import { ArrowRight, BookOpen } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatRelativeDate } from '@/lib/utils/date';

interface CourseCardProps {
  course: {
    id: string;
    name: string;
    description: string | null;
    teacher_id: string | null;
    created_at: string;
  };
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="h-full transition-colors hover:border-primary/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BookOpen className="h-5 w-5" aria-hidden />
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-1">
        <CardTitle className="line-clamp-1 text-base">{course.name}</CardTitle>
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {course.description ?? 'Sin descripción.'}
        </CardDescription>
        <p className="pt-2 text-xs text-muted-foreground">
          Creado {formatRelativeDate(course.created_at)}
        </p>
      </CardContent>
    </Card>
  );
}
