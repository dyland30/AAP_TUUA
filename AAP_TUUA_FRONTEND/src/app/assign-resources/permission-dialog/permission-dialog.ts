import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Feature } from '../../models';

export interface PermissionDialogData {
  resourceName: string | null;
  permissions: Feature[];
  selected: number[];
}

@Component({
  selector: 'app-permission-dialog',
  imports: [MatDialogModule, MatButtonModule, MatCheckboxModule],
  templateUrl: './permission-dialog.html',
  styleUrl: './permission-dialog.css',
})
export class PermissionDialog {
  protected readonly data = inject<PermissionDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<PermissionDialog, number[]>>(MatDialogRef);

  protected readonly selected = signal<ReadonlySet<number>>(new Set(this.data.selected));

  protected isSelected(permissionId: number): boolean {
    return this.selected().has(permissionId);
  }

  protected toggle(permissionId: number): void {
    const next = new Set(this.selected());
    if (next.has(permissionId)) {
      next.delete(permissionId);
    } else {
      next.add(permissionId);
    }
    this.selected.set(next);
  }

  protected save(): void {
    this.dialogRef.close([...this.selected()]);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
