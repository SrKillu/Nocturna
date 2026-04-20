'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, ExternalLink, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type InviteStatus = 'active' | 'expired' | 'used' | 'revoked';

interface Props {
  token: string;
  status: InviteStatus;
  expiresAt: string;
  title: string;
  subtitle?: string | null;
  /**
   * Acción unificada: primera pulsación = revocar, segunda (cuando
   * `status === 'revoked'`) = eliminar definitivamente.
   */
  onRevoke?: () => void;
  onDelete?: () => void;
  revoking?: boolean;
  /** Si `true`, oculta las acciones destructivas. */
  readOnly?: boolean;
}

function statusBadge(status: InviteStatus) {
  switch (status) {
    case 'active':
      return <Badge>Activa</Badge>;
    case 'expired':
      return <Badge variant="outline">Expirada</Badge>;
    case 'used':
      return <Badge variant="secondary">Usada</Badge>;
    case 'revoked':
      return <Badge variant="destructive">Revocada</Badge>;
  }
}

/**
 * Card autocontenido que renderiza el QR en canvas, ofrece copiar el enlace y
 * (opcional) revocar la invitación. Se basa en `qrcode` para generar el PNG en
 * el cliente; no hacemos round-trip al backend para pintar el QR.
 */
export function InviteQrCard({
  token,
  status,
  expiresAt,
  title,
  subtitle,
  onRevoke,
  onDelete,
  revoking,
  readOnly,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const absolute = `${window.location.origin}/invite/${token}`;
    setUrl(absolute);
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, absolute, {
        width: 176,
        margin: 1,
        errorCorrectionLevel: 'M',
      }).catch(() => undefined);
    }
  }, [token]);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar');
    }
  }

  const inactive = status !== 'active';

  return (
    <div
      className={cn(
        'flex gap-4 rounded-lg border bg-card p-4',
        inactive && 'opacity-70'
      )}
    >
      <div className="relative flex h-44 w-44 shrink-0 items-center justify-center rounded-md border bg-white">
        <canvas ref={canvasRef} aria-label="QR de invitación" />
        {inactive ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-background/70 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur-[1px]">
            {status}
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{title}</p>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {statusBadge(status)}
        </div>
        <p className="text-xs text-muted-foreground">
          Expira{' '}
          {new Date(expiresAt).toLocaleString('es', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={copy} disabled={!url}>
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar enlace
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <a href={`/invite/${token}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Abrir
            </a>
          </Button>
          {onRevoke && !readOnly && status === 'active' ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onRevoke}
              disabled={revoking}
            >
              {revoking ? 'Revocando…' : 'Revocar'}
            </Button>
          ) : null}
          {onDelete && !readOnly && status === 'revoked' ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
              disabled={revoking}
            >
              {revoking ? 'Eliminando…' : 'Eliminar'}
            </Button>
          ) : null}
          {!url ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <QrCode className="h-3 w-3" /> Generando QR…
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
