/**
 * Deterministic accent palette for courses — the same course always gets the
 * same hero gradient, mirroring Google Classroom’s visual memory hook.
 *
 * We do not persist the color in the DB; it’s derived from the UUID so every
 * client renders identically without extra round-trips.
 */

export interface CourseAccent {
  from: string; // Tailwind gradient start class
  to: string;   // Tailwind gradient end class
  ring: string; // soft tint for hover border
  chip: string; // badge fill on the hero
  label: string;
}

const ACCENTS: CourseAccent[] = [
  { from: 'from-violet-500', to: 'to-indigo-600', ring: 'hover:ring-violet-200', chip: 'bg-white/20 text-white', label: 'violet' },
  { from: 'from-sky-500',    to: 'to-blue-600',   ring: 'hover:ring-sky-200',    chip: 'bg-white/20 text-white', label: 'sky' },
  { from: 'from-emerald-500', to: 'to-teal-600',  ring: 'hover:ring-emerald-200',chip: 'bg-white/20 text-white', label: 'emerald' },
  { from: 'from-rose-500',   to: 'to-pink-600',   ring: 'hover:ring-rose-200',   chip: 'bg-white/20 text-white', label: 'rose' },
  { from: 'from-amber-500',  to: 'to-orange-600', ring: 'hover:ring-amber-200',  chip: 'bg-white/20 text-white', label: 'amber' },
  { from: 'from-fuchsia-500', to: 'to-purple-600',ring: 'hover:ring-fuchsia-200',chip: 'bg-white/20 text-white', label: 'fuchsia' },
  { from: 'from-cyan-500',   to: 'to-blue-600',   ring: 'hover:ring-cyan-200',   chip: 'bg-white/20 text-white', label: 'cyan' },
  { from: 'from-lime-500',   to: 'to-green-600',  ring: 'hover:ring-lime-200',   chip: 'bg-white/20 text-white', label: 'lime' },
];

/** FNV-1a 32-bit hash, deterministic and tiny. */
function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

export function accentFor(id: string | null | undefined): CourseAccent {
  if (!id) return ACCENTS[0];
  return ACCENTS[hashString(id) % ACCENTS.length];
}

export function courseInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'C';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
