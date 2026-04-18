'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Download,
  FileUp,
  Loader2,
  Paperclip,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api/client';

const MAX_BYTES = 50 * 1024 * 1024;

interface MaterialRow {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

function formatBytes(n: number | null): string {
  if (n == null) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function CourseMaterialsTab({
  courseId,
  canManage,
}: {
  courseId: string;
  canManage: boolean;
}) {
  const [rows, setRows] = useState<MaterialRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/courses/${courseId}/materials`);
      const json = (await res.json().catch(() => ({}))) as { data?: MaterialRow[] };
      setRows(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    if (file.size > MAX_BYTES) {
      toast.error('Archivo demasiado grande (máx 50 MB)');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set('title', title.trim());
      if (description.trim()) fd.set('description', description.trim());
      fd.set('file', file);
      const res = await apiFetch(`/api/courses/${courseId}/materials`, {
        method: 'POST',
        body: fd,
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!res.ok) {
        toast.error('No se pudo subir', { description: json.error?.message });
        return;
      }
      toast.success('Material subido');
      setTitle('');
      setDescription('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id: string, name: string) {
    if (!window.confirm(`¿Eliminar "${name}"?`)) return;
    const res = await apiFetch(`/api/materials/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('No se pudo eliminar');
      return;
    }
    toast.success('Material eliminado');
    await load();
  }

  return (
    <div className="space-y-4">
      {canManage ? (
        <form
          onSubmit={onUpload}
          className="space-y-3 rounded-md border bg-muted/30 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mat-title">Título</Label>
              <Input
                id="mat-title"
                placeholder="Guía de estudio · Unidad 3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-file">Archivo (máx 50 MB)</Label>
              <Input
                id="mat-file"
                ref={fileRef}
                type="file"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && f.size > MAX_BYTES) {
                    toast.error('Archivo demasiado grande');
                    e.target.value = '';
                    return;
                  }
                  setFile(f);
                }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mat-desc">Descripción (opcional)</Label>
            <Textarea
              id="mat-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={uploading || !file || !title.trim()}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo…
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" /> Subir material
                </>
              )}
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !rows || rows.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Todavía no hay materiales publicados.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {rows.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 px-4 py-3 text-sm"
            >
              <Paperclip
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.file_name}
                  {m.file_size ? ` · ${formatBytes(m.file_size)}` : ''}
                </p>
                {m.description ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {m.description}
                  </p>
                ) : null}
              </div>
              <Button asChild size="sm" variant="outline">
                <a
                  href={`/api/materials/${m.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <Download className="mr-1.5 h-4 w-4" /> Descargar
                </a>
              </Button>
              {canManage ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(m.id, m.title)}
                  aria-label={`Eliminar ${m.title}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
