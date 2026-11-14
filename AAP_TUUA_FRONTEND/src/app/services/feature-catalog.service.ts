import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Feature, FeatureGroup } from '../models';
import { FeatureService } from './feature.service';

/**
 * Carga de catálogos (feature_group / feature) para los selectores de los CRUD.
 * Los grupos se identifican por nombre, sin distinguir mayúsculas ni espacios laterales.
 */
@Injectable({ providedIn: 'root' })
export class FeatureCatalogService {
  private readonly featureService = inject(FeatureService);

  /** Devuelve los grupos indicados, cada uno con sus características. */
  loadGroups(names: string[]): Observable<FeatureGroup[]> {
    return this.featureService.getAllFeatureGroups().pipe(
      switchMap((groups) => {
        const relevant = (groups ?? []).filter((group) =>
          names.some((name) => this.sameName(group.name, name)),
        );
        if (relevant.length === 0) return of<FeatureGroup[]>([]);
        return forkJoin(
          relevant.map((group) =>
            this.featureService
              .getFeaturesByGroup(group.id)
              .pipe(map((features) => ({ ...group, features: features ?? [] }))),
          ),
        );
      }),
    );
  }

  /** Características activas del grupo indicado. */
  featuresOf(groups: FeatureGroup[], name: string | string[]): Feature[] {
    const names = Array.isArray(name) ? name : [name];
    const group = groups.find((item) =>
      names.some((candidate) => this.sameName(item.name, candidate)),
    );
    return (group?.features ?? []).filter((feature) => feature.is_active);
  }

  /** Busca una característica del grupo por su abreviatura. */
  findByAbbreviation(
    groups: FeatureGroup[],
    name: string | string[],
    abbreviation: string,
  ): Feature | null {
    const target = abbreviation.trim().toLocaleUpperCase();
    return (
      this.featuresOf(groups, name).find(
        (feature) => (feature.abbreviation ?? '').trim().toLocaleUpperCase() === target,
      ) ?? null
    );
  }

  /** Descripción de una característica (o su id cuando no está cargada). */
  label(groups: FeatureGroup[], id: number | null): string {
    if (id === null || id === undefined) return '—';
    for (const group of groups) {
      const feature = (group.features ?? []).find((item) => item.id === id);
      if (feature) return feature.description || feature.abbreviation || String(id);
    }
    return String(id);
  }

  private sameName(candidate: string | null, target: string): boolean {
    return (candidate ?? '').trim().toLocaleLowerCase() === target.trim().toLocaleLowerCase();
  }
}
