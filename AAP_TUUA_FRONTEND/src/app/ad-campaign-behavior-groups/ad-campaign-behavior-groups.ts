import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, concat, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AdCampaign, AdCampaignBehaviorGroup, BehaviorGroup } from '../models';
import {
  AdCampaignBehaviorGroupService,
  AdCampaignService,
  BehaviorGroupService,
} from '../services';

@Component({
  selector: 'app-ad-campaign-behavior-groups',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './ad-campaign-behavior-groups.html',
  styleUrl: '../assign-cashier-machines/assign-cashier-machines.css',
})
export class AdCampaignBehaviorGroups implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly campaignService = inject(AdCampaignService);
  private readonly behaviorGroupService = inject(BehaviorGroupService);
  private readonly assignmentService = inject(AdCampaignBehaviorGroupService);

  private readonly campaignId = this.route.snapshot.paramMap.get('campaignId');

  protected readonly campaign = signal<AdCampaign | null>(null);
  protected readonly behaviorGroups = signal<BehaviorGroup[]>([]);
  private readonly originalIds = signal<ReadonlySet<string>>(new Set<string>());
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set<string>());
  protected readonly search = signal('');
  // Grupos activos del aeropuerto de la campaña (o globales); se incluyen también los ya asignados.
  protected readonly availableGroups = computed(() => {
    const airportId = this.campaign()?.airport_id ?? null;
    const original = this.originalIds();
    return this.behaviorGroups()
      .filter(
        (group) =>
          !!group.id &&
          (original.has(group.id) ||
            (group.is_active &&
              (!airportId || !group.airport_id || group.airport_id === airportId))),
      )
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  });
  protected readonly filteredGroups = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.availableGroups().filter(
      (group) =>
        !query ||
        [group.code, group.name, group.description].some((value) =>
          value?.toLocaleLowerCase().includes(query),
        ),
    );
  });
  protected readonly selectedCount = computed(() => this.selectedIds().size);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    if (!this.campaignId) {
      this.errorMessage.set('No se especificó una campaña.');
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    forkJoin({
      campaign: this.campaignService.getById(this.campaignId),
      groups: this.behaviorGroupService.getAll(),
      assignments: this.assignmentService.getByAdCampaignId(this.campaignId),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ campaign, groups, assignments }) => {
          this.campaign.set(campaign);
          this.behaviorGroups.set(groups ?? []);
          const ids = new Set(
            (assignments ?? [])
              .map((assignment) => assignment.behavior_group_id)
              .filter((id): id is string => !!id),
          );
          this.originalIds.set(ids);
          this.selectedIds.set(new Set(ids));
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected campaignLabel(): string {
    return this.campaign()?.name || this.campaignId || '';
  }

  protected scopeLabel(group: BehaviorGroup): string {
    return group.airport_id ? 'Del aeropuerto' : 'Global';
  }

  protected isSelected(id: string | null): boolean {
    return id !== null && this.selectedIds().has(id);
  }

  protected toggle(group: BehaviorGroup): void {
    const id = group.id;
    if (!id) return;

    this.clearMessages();
    const next = new Set(this.selectedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedIds.set(next);
  }

  protected save(): void {
    if (!this.campaignId || this.isSaving()) return;

    this.clearMessages();
    const selected = this.selectedIds();
    const original = this.originalIds();
    const added = [...selected].filter((id) => !original.has(id));
    const removed = [...original].filter((id) => !selected.has(id));

    const requests: Observable<unknown>[] = [];
    for (const id of removed) {
      requests.push(this.assignmentService.delete(this.campaignId, id));
    }
    for (const id of added) {
      const assignment: AdCampaignBehaviorGroup = {
        ad_campaign_id: this.campaignId,
        behavior_group_id: id,
        created_at: null,
        updated_at: null,
        created_by: null,
        modified_by: null,
      };
      requests.push(this.assignmentService.add(assignment));
    }

    if (requests.length === 0) {
      this.successMessage.set('No hay cambios por guardar.');
      return;
    }

    this.isSaving.set(true);
    concat(...requests)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        complete: () => {
          this.load();
          this.successMessage.set('Grupos de la campaña actualizados correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.resolveError(error));
          // Algunas operaciones pudieron aplicarse antes del error: se recarga el estado real.
          this.reloadAssignments();
        },
      });
  }

  protected back(): void {
    this.router.navigate(['/ad_campaigns']);
  }

  private reloadAssignments(): void {
    if (!this.campaignId) return;
    this.assignmentService.getByAdCampaignId(this.campaignId).subscribe({
      next: (assignments) => {
        const ids = new Set(
          (assignments ?? [])
            .map((assignment) => assignment.behavior_group_id)
            .filter((id): id is string => !!id),
        );
        this.originalIds.set(ids);
      },
    });
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private resolveError(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
