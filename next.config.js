/** @type {import('next').NextConfig} */

// Keep this list aligned with lib/security/csp.ts. Headers here are the ones
// that are safe to apply statically at the edge; the dynamic CSP (with a
// per-request nonce) is injected by middleware.
//
// Frame embedding note:
//   The Emergent preview renders the app inside an iframe on
//   *.preview.emergentagent.com. `X-Frame-Options: DENY` cannot express an
//   allowlist, so we rely exclusively on the CSP `frame-ancestors` directive
//   (configured in lib/security/csp.ts) which supersedes XFO in every modern
//   browser and supports per-origin allowlists.
const staticSecurityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'X-XSS-Protection',          value: '0' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin-allow-popups' },
  { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
  // COEP is intentionally 'unsafe-none' because Supabase Storage signed URLs
  // live on a different origin. Tighten to 'require-corp' only after auditing
  // that every cross-origin asset is served with CORP headers.
  { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
  {
    key: 'Permissions-Policy',
    value: [
      'accelerometer=()',
      'autoplay=()',
      'camera=()',
      'display-capture=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'payment=()',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'xr-spatial-tracking=()',
    ].join(', '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: staticSecurityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
