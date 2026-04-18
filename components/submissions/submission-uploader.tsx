'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  CheckCircle2,
  FileUp,
  Loader2,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { apiFetch } from '@/lib/api/client';
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
} from '@/lib/validations/files';

/**
 * Three-step secure upload:
 *   1. POST /api/files/upload         → {fileId, path, token, signedUrl}
 *   2. PUT/upload to Supabase Storage  (direct from the browser)
 *   3. POST /api/files/confirm         → magic-byte verification, status "clean"
 *   4. POST /api/tasks/:id/submissions → link the file to the submission
 *
 * The component owns the phase state machine and renders progress for each
 * step. Reusable: drops into any page that knows the taskId.
 */

type Phase =
  | { kind: 'idle' }
  | { kind: 'requesting' }
  | { kind: 'uploading'; progress: number }
  | { kind: 'confirming' }
  | { kind: 'submitting' }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

interface SubmissionUploaderProps {
  taskId: string;
  existingStatus?: 'submitted' | 'graded' | 'late' | 'returned' | null;
}

const ACCEPT_ATTR = ALLOWED_MIME_TYPES.join(',');
const MAX_MB = (MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0);

export function SubmissionUploader({
  taskId,
  existingStatus,
}: SubmissionUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  const disabled =
    phase.kind === 'requesting' ||
    phase.kind === 'uploading' ||
    phase.kind === 'confirming' ||
    phase.kind === 'submitting' ||
    existingStatus === 'graded';

  const pickFile = useCallback((incoming: File | undefined | null) => {
    if (!incoming) return;
    if (incoming.size > MAX_UPLOAD_BYTES) {
      toast.error('Archivo demasiado grande', {
        description: `El límite es ${MAX_MB} MB.`,
      });
      return;
    }
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(incoming.type)) {
      toast.error('Formato no permitido', {
        description: 'Usa PDF, Office, Markdown, CSV, TXT o imágenes PNG/JPG/WEBP.',
      });
      return;
    }
    setFile(incoming);
    setPhase({ kind: 'idle' });
  }, []);

  async function uploadWithProgress(
    signedUrl: string,
    blob: File
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', signedUrl, true);
      xhr.setRequestHeader('content-type', blob.type);
      xhr.upload.onprogress = (ev) => {
        if (!ev.lengthComputable) return;
        setPhase({
          kind: 'uploading',
          progress: Math.min(99, Math.round((ev.loaded / ev.total) * 100)),
        });
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Storage PUT failed: ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error('Network error uploading file'));
      xhr.send(blob);
    });
  }

  async function handleSubmit(): Promise<void> {
    if (!file && !content.trim()) {
      toast.error('Adjunta un archivo o escribe contenido');
      return;
    }

    try {
      let uploadedPath: string | null = null;

      if (file) {
        // Step 1 — request upload URL
        setPhase({ kind: 'requesting' });
        const issueRes = await apiFetch('/api/files/upload', {
          method: 'POST',
          body: JSON.stringify({
            bucket: 'submissions',
            taskId,
            mimeType: file.type,
            size: file.size,
            originalName: file.name.slice(0, 200),
          }),
        });
        const issueBody = (await issueRes.json().catch(() => ({}))) as {
          data?: { fileId: string; signedUrl: string; path: string };
          error?: { message?: string };
        };
        if (!issueRes.ok || !issueBody.data) {
          throw new Error(issueBody.error?.message ?? `HTTP ${issueRes.status}`);
        }
        const { fileId, signedUrl, path } = issueBody.data;

        // Step 2 — direct PUT to storage
        setPhase({ kind: 'uploading', progress: 0 });
        await uploadWithProgress(signedUrl, file);

        // Step 3 — confirm (magic bytes)
        setPhase({ kind: 'confirming' });
        const confirmRes = await apiFetch('/api/files/confirm', {
          method: 'POST',
          body: JSON.stringify({ fileId }),
        });
        const confirmBody = (await confirmRes.json().catch(() => ({}))) as {
          data?: { scanStatus: 'clean' | 'blocked' };
          error?: { message?: string };
        };
        if (!confirmRes.ok) {
          throw new Error(confirmBody.error?.message ?? 'Confirmación rechazada');
        }
        if (confirmBody.data?.scanStatus !== 'clean') {
          throw new Error('El archivo fue bloqueado por el control de integridad.');
        }
        uploadedPath = path;
      }

      // Step 4 — create / update submission row
      setPhase({ kind: 'submitting' });
      const submitRes = await apiFetch(`/api/tasks/${taskId}/submissions`, {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim() ? content.trim() : null,
          filePath: uploadedPath,
        }),
      });
      const submitBody = (await submitRes.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!submitRes.ok) {
        throw new Error(submitBody.error?.message ?? `HTTP ${submitRes.status}`);
      }

      setPhase({ kind: 'done' });
      toast.success('Entrega registrada');
      setFile(null);
      setContent('');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPhase({ kind: 'error', message: msg });
      toast.error('No pudimos completar la entrega', { description: msg });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {existingStatus === 'graded' ? 'Entrega calificada' : 'Enviar entrega'}
        </CardTitle>
        <CardDescription>
          {existingStatus === 'graded'
            ? 'Esta entrega ya fue calificada y no se puede modificar.'
            : 'Adjunta un archivo y/o escribe un comentario. El archivo se sube cifrado y se verifica antes de registrarse.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            if (disabled) return;
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            if (disabled) return;
            e.preventDefault();
            setDragOver(false);
            pickFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
            disabled
              ? 'cursor-not-allowed border-muted bg-muted/30 text-muted-foreground'
              : dragOver
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-muted-foreground/20 bg-card hover:border-primary/50 hover:bg-muted/40'
          }`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            {file ? (
              <FileUp className="h-5 w-5" aria-hidden />
            ) : (
              <UploadCloud className="h-5 w-5" aria-hidden />
            )}
          </span>
          {file ? (
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB · {file.type || 'tipo desconocido'}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium">
                Arrastra un archivo o haz clic para seleccionarlo
              </p>
              <p className="text-xs text-muted-foreground">
                Máx. {MAX_MB} MB · PDF, Office, Markdown, CSV, TXT, PNG, JPG, WEBP
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_ATTR}
            className="sr-only"
            disabled={disabled}
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Optional text comment */}
        <div className="space-y-2">
          <Label htmlFor="submission-content">Comentario (opcional)</Label>
          <Textarea
            id="submission-content"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Notas para el profesor, enlaces, justificaciones…"
            disabled={disabled}
          />
        </div>

        <PhaseStatus phase={phase} />

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setFile(null);
              setContent('');
              setPhase({ kind: 'idle' });
            }}
            disabled={disabled || (!file && !content && phase.kind === 'idle')}
          >
            Limpiar
          </Button>
          <Button onClick={handleSubmit} disabled={disabled}>
            {phase.kind === 'requesting' ||
            phase.kind === 'uploading' ||
            phase.kind === 'confirming' ||
            phase.kind === 'submitting' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando…
              </>
            ) : existingStatus === 'submitted' ? (
              'Re-enviar'
            ) : (
              'Enviar entrega'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PhaseStatus({ phase }: { phase: Phase }) {
  if (phase.kind === 'idle') return null;
  if (phase.kind === 'done') {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        <CheckCircle2 className="h-4 w-4" /> Entrega enviada correctamente.
      </div>
    );
  }
  if (phase.kind === 'error') {
    return (
      <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> {phase.message}
      </div>
    );
  }
  if (phase.kind === 'uploading') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Subiendo archivo…</span>
          <span>{phase.progress}%</span>
        </div>
        <Progress value={phase.progress} />
      </div>
    );
  }
  const labels: Record<string, string> = {
    requesting: 'Solicitando permiso de subida…',
    confirming: 'Verificando integridad del archivo…',
    submitting: 'Registrando entrega…',
  };
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      <span>{labels[phase.kind]}</span>
    </div>
  );
}
