import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Airport, AirportResource, Feature, Terminal } from '../../models';

export interface ResourceSelectorDialogData {
  airports: Airport[];
  terminals: Terminal[];
  resources: AirportResource[];
  resourceTypes: Feature[];
  airportId: string | null;
  selectedId: string | null;
}

@Component({
  selector: 'app-resource-selector-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './resource-selector-dialog.html',
  styleUrl: './resource-selector-dialog.css',
})
export class ResourceSelectorDialog {
  protected readonly data = inject<ResourceSelectorDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<ResourceSelectorDialog, string>>(MatDialogRef);

  protected readonly airportId = signal<string | null>(this.data.airportId);
  protected readonly terminalId = signal<string | null>(null);
  protected readonly typeId = signal<number | null>(null);
  protected readonly search = signal('');
  protected readonly selectedId = signal<string | null>(this.data.selectedId);

  private readonly terminalIndex = new Map(
    this.data.terminals.filter((terminal) => terminal.id).map((terminal) => [terminal.id!, terminal]),
  );
  private readonly airportIndex = new Map(
    this.data.airports.filter((airport) => airport.id).map((airport) => [airport.id!, airport]),
  );
  private readonly typeIndex = new Map(this.data.resourceTypes.map((type) => [type.id, type]));

  protected readonly terminalOptions = computed(() => {
    const airportId = this.airportId();
    return this.data.terminals.filter(
      (terminal) => terminal.is_active && (!airportId || terminal.airport_id === airportId),
    );
  });

  protected readonly filteredResources = computed(() => {
    const airportId = this.airportId();
    const terminalId = this.terminalId();
    const typeId = this.typeId();
    const query = this.search().trim().toLocaleLowerCase();
    return this.data.resources.filter((resource) => {
      if (!resource.is_active && resource.id !== this.data.selectedId) return false;
      if (terminalId && resource.terminal_id !== terminalId) return false;
      if (airportId && this.terminalIndex.get(resource.terminal_id ?? '')?.airport_id !== airportId) {
        return false;
      }
      if (typeId !== null && resource.resource_type_id !== typeId) return false;
      if (!query) return true;
      return [resource.code, resource.name].some((value) => value?.toLocaleLowerCase().includes(query));
    });
  });

  protected onAirportChange(airportId: string | null): void {
    this.airportId.set(airportId);
    this.terminalId.set(null);
  }

  protected airportLabel(terminalId: string | null): string {
    const airportId = this.terminalIndex.get(terminalId ?? '')?.airport_id;
    const airport = airportId ? this.airportIndex.get(airportId) : null;
    if (!airport) return '—';
    return airport.iata_code || airport.oaci_code || airport.name || '—';
  }

  protected terminalLabel(terminalId: string | null): string {
    return this.terminalIndex.get(terminalId ?? '')?.name || '—';
  }

  protected typeLabel(typeId: number | null): string {
    if (typeId === null) return '—';
    return this.typeIndex.get(typeId)?.description || String(typeId);
  }

  protected select(resource: AirportResource): void {
    if (resource.id) this.selectedId.set(resource.id);
  }

  protected confirm(): void {
    const id = this.selectedId();
    if (id) this.dialogRef.close(id);
  }

  protected pick(resource: AirportResource): void {
    if (!resource.id) return;
    this.dialogRef.close(resource.id);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
