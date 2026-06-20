'use client';

import { useMemo, useState } from 'react';
import { BookMarked } from 'lucide-react';

import { V2LibraryCollectionsPanel } from '@/components/v2/library/v2-library-collections-panel';
import { V2LibraryEmptyState } from '@/components/v2/library/v2-library-empty-state';
import { V2LibraryFeaturedPanel } from '@/components/v2/library/v2-library-featured-panel';
import { V2LibraryFilters } from '@/components/v2/library/v2-library-filters';
import { V2LibraryHeader } from '@/components/v2/library/v2-library-header';
import { V2LibraryMobileList } from '@/components/v2/library/v2-library-mobile-list';
import { V2LibrarySummary } from '@/components/v2/library/v2-library-summary';
import { V2LibraryTable } from '@/components/v2/library/v2-library-table';
import {
  filterLibraryV2,
  type LibraryV2FilterState,
  type LibraryV2Fixture,
} from '@/lib/types/library-v2';

const initialFilters: LibraryV2FilterState = {
  query: '',
  collectionId: 'all',
  type: 'all',
  courseId: 'all',
  level: 'all',
  availability: 'all',
  period: 'all',
};

export function V2LibraryPage({ library }: { library: LibraryV2Fixture }) {
  const [filters, setFilters] = useState<LibraryV2FilterState>(initialFilters);
  const filteredResources = useMemo(
    () => filterLibraryV2(library.resources, filters),
    [library.resources, filters]
  );
  const courseOptions = useMemo(() => {
    const courses = new Map<string, string>();
    library.resources.forEach((resource) => {
      if (resource.courseId) courses.set(resource.courseId, resource.courseName);
    });
    return Array.from(courses, ([courseId, courseName]) => ({
      courseId,
      courseName,
    }));
  }, [library.resources]);
  const hasFilters = Object.entries(filters).some(
    ([key, value]) => value !== initialFilters[key as keyof LibraryV2FilterState]
  );

  return (
    <div className="space-y-5">
      <V2LibraryHeader />
      <V2LibrarySummary summary={library.summary} />
      <V2LibraryFilters
        filters={filters}
        collections={library.collections}
        courseOptions={courseOptions}
        onChange={setFilters}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">
            {filteredResources.length}
          </span>{' '}
          {filteredResources.length === 1 ? 'recurso visible' : 'recursos visibles'}
        </p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BookMarked className="h-4 w-4" aria-hidden />
          Biblioteca académica de demostración
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.55fr)]">
        <div>
          {filteredResources.length === 0 ? (
            <div className="rounded-md border bg-card p-4">
              <V2LibraryEmptyState filtered={hasFilters} />
            </div>
          ) : (
            <>
              <V2LibraryTable resources={filteredResources} />
              <V2LibraryMobileList resources={filteredResources} />
            </>
          )}
        </div>
        <div className="space-y-5">
          {library.collections.length > 0 ? (
            <V2LibraryCollectionsPanel collections={library.collections} />
          ) : (
            <V2LibraryEmptyState filtered={false} />
          )}
          {library.featured.length > 0 ? (
            <V2LibraryFeaturedPanel resources={library.featured} />
          ) : (
            <V2LibraryEmptyState filtered={false} />
          )}
        </div>
      </div>
    </div>
  );
}
