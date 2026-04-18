'use client';

import { useEffect } from 'react';

/**
 * Top-level fallback used when even the root layout crashes. Must be a
 * standalone HTML shell because the app shell itself may have failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[global:error]', error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
          <div style={{ maxWidth: 420, textAlign: 'center' }}>
            <h1 style={{ fontSize: 20, fontWeight: 600 }}>Nocturna tuvo un problema</h1>
            <p style={{ color: '#64748b', marginTop: 8 }}>
              Vuelve a cargar la página. Si persiste, contacta al administrador de tu institución.
            </p>
            <button
              onClick={() => reset()}
              style={{
                marginTop: 16,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
