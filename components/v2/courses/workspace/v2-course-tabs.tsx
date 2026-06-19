const workspaceTabs = ['Resumen', 'Estudiantes', 'Evaluaciones', 'Materiales'] as const;

export function V2CourseTabs() {
  return (
    <div
      role="tablist"
      aria-label="Secciones del workspace del curso"
      className="flex gap-1 overflow-x-auto rounded-md border bg-muted/20 p-1"
    >
      {workspaceTabs.map((tab, index) => (
        <span
          key={tab}
          role="tab"
          aria-selected={index === 0}
          className={
            index === 0
              ? 'whitespace-nowrap rounded-sm bg-background px-3 py-2 text-sm font-medium shadow-sm'
              : 'whitespace-nowrap rounded-sm px-3 py-2 text-sm text-muted-foreground'
          }
        >
          {tab}
        </span>
      ))}
    </div>
  );
}
