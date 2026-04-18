'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

/**
 * Theme toggle
 *  * Shows a Sun in light mode and a Moon in dark mode, cross-fading on change.
 *  * Opens a dropdown to pick explicitly: Light / Dark / System.
 *  * Runs a short `theme-transition` class on <html> during the swap so the
 *    color change feels soft (no hard flip) but the transition never lingers
 *    beyond the swap — which would otherwise slow every hover.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const apply = useCallback(
    (next: 'light' | 'dark' | 'system') => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.add('theme-transition');
        window.setTimeout(
          () => document.documentElement.classList.remove('theme-transition'),
          220
        );
      }
      setTheme(next);
    },
    [setTheme]
  );

  const isDark = mounted && (resolvedTheme ?? theme) === 'dark';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Cambiar tema"
          className={cn('relative h-9 w-9', className)}
        >
          <Sun
            className={cn(
              'absolute h-[1.15rem] w-[1.15rem] transition-all duration-300',
              isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
            )}
            aria-hidden
          />
          <Moon
            className={cn(
              'absolute h-[1.15rem] w-[1.15rem] transition-all duration-300',
              isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
            )}
            aria-hidden
          />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => apply('light')}>
          <Sun className="mr-2 h-4 w-4" /> Claro
          {theme === 'light' ? <Check /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => apply('dark')}>
          <Moon className="mr-2 h-4 w-4" /> Oscuro
          {theme === 'dark' ? <Check /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => apply('system')}>
          <Monitor className="mr-2 h-4 w-4" /> Sistema
          {theme === 'system' ? <Check /> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Check() {
  return (
    <span
      aria-hidden
      className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
    />
  );
}
