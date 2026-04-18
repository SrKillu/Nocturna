'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Theme provider for Nocturna.
 *
 *  * attribute="class"  → next-themes toggles `class="dark"` on <html>.
 *  * defaultTheme="system" with enableSystem so users get the OS preference
 *    until they explicitly pick one.
 *  * disableTransitionOnChange is left OFF because our globals.css defines a
 *    scoped `html.theme-transition` rule that is attached only while the
 *    user is toggling, eliminating flicker without sacrificing the smooth
 *    color crossfade.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="nocturna.theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
