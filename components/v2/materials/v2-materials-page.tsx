'use client';

import { useMemo, useState } from 'react';
import { Library } from 'lucide-react';

import { V2MaterialsEmptyState } from '@/components/v2/materials/v2-materials-empty-state';
import { V2MaterialsFilters } from '@/components/v2/materials/v2-materials-filters';
import { V2MaterialsHeader } from '@/components/v2/materials/v2-materials-header';
import { V2MaterialsMobileList } from '@/components/v2/materials/v2-materials-mobile-list';
import { V2MaterialsRecentPanel } from '@/components/v2/materials/v2-materials-recent-panel';
import { V2MaterialsSummary } from '@/components/v2/materials/v2-materials-summary';
import { V2MaterialsTable } from '@/components/v2/materials/v2-materials-table';
import {
  filterMaterialsV2,
  type MaterialV2FilterState,
  type MaterialsV2Fixture,
} from '@/lib/types/materials-v2';

const initialFilters: MaterialV2FilterState = {
  query: '',
  courseId: 'all',
  section: 'all',
  type: 'all',
  visibility: 'all',
  period: 'all',
};

export function V2MaterialsPage({ materials }: { materials: MaterialsV2Fixture }) {
  const [filters, setFilters] = useState<MaterialV2FilterState>(initialFilters);
  const filteredMaterials = useMemo(
    () => filterMaterialsV2(materials.materials, filters),
    [materials.materials, filters]
  );
  const courseOptions = useMemo(() => {
    const courses = new Map<string, string>();
    materials.materials.forEach((material) =>
      courses.set(material.courseId, material.courseName)
    );
    return Array.from(courses, ([courseId, courseName]) => ({
      courseId,
      courseName,
    }));
  }, [materials.materials]);
  const sectionOptions = useMemo(
    () =>
      Array.from(
        new Set(materials.materials.map((material) => material.sectionLabel))
      ),
    [materials.materials]
  );
  const hasFilters = Object.entries(filters).some(
    ([key, value]) => value !== initialFilters[key as keyof MaterialV2FilterState]
  );

  return (
    <div className="space-y-5">
      <V2MaterialsHeader />
      <V2MaterialsSummary summary={materials.summary} />
      <V2MaterialsFilters
        filters={filters}
        courseOptions={courseOptions}
        sectionOptions={sectionOptions}
        onChange={setFilters}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{filteredMaterials.length}</span>{' '}
          {filteredMaterials.length === 1 ? 'material visible' : 'materiales visibles'}
        </p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Library className="h-4 w-4" aria-hidden />
          Recursos académicos de demostración
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.55fr)]">
        <div>
          {filteredMaterials.length === 0 ? (
            <div className="rounded-md border bg-card p-4">
              <V2MaterialsEmptyState filtered={hasFilters} />
            </div>
          ) : (
            <>
              <V2MaterialsTable materials={filteredMaterials} />
              <V2MaterialsMobileList materials={filteredMaterials} />
            </>
          )}
        </div>
        {materials.recent.length === 0 ? (
          <div className="rounded-md border bg-card p-4">
            <V2MaterialsEmptyState filtered={false} />
          </div>
        ) : (
          <V2MaterialsRecentPanel materials={materials.recent} />
        )}
      </div>
    </div>
  );
}
