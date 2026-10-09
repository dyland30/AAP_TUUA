import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Resource } from '../models';
import { ResourceService } from '../services/resource.service';

const MOBILE_QUERY = '(max-width: 840px)';
const EXPANDED_WIDTH = 264;
const COLLAPSED_WIDTH = 76;

export interface MenuNode {
  resource: Resource;
  children: MenuNode[];
}

@Component({
  selector: 'app-menu',
  imports: [MatSidenavModule, MatButtonModule, MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit {
  private readonly resourceService = inject(ResourceService);
  private readonly breakpoint = inject(BreakpointObserver);

  protected readonly collapsed = signal(false);
  protected readonly isMobile = signal(false);
  protected readonly mobileOpen = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly resources = signal<Resource[]>([]);
  private readonly expandedGroups = signal<ReadonlySet<string>>(new Set<string>());

  protected readonly menuTree = computed(() => this.buildTree(this.resources()));
  protected readonly drawerWidth = computed(() =>
    !this.isMobile() && this.collapsed() ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
  );

  constructor() {
    this.breakpoint.observe(MOBILE_QUERY).subscribe((state) => {
      this.isMobile.set(state.matches);
      this.mobileOpen.set(false);
    });
  }

  ngOnInit(): void {
    this.loadMenu();
  }

  protected toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }

  toggleMobile(): void {
    this.mobileOpen.update((value) => !value);
  }

  protected toggleGroup(node: MenuNode): void {
    const id = node.resource.id;
    if (!id) {
      return;
    }
    this.expandedGroups.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  protected isGroupOpen(node: MenuNode): boolean {
    return node.resource.id !== null && this.expandedGroups().has(node.resource.id);
  }

  private loadMenu(): void {
    this.isLoading.set(true);
    this.resourceService.getAll().subscribe({
      next: (resources) => {
        this.resources.set(resources ?? []);
        this.expandGroupsWithChildren();
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private expandGroupsWithChildren(): void {
    const ids = this.menuTree()
      .filter((node) => node.children.length > 0 && node.resource.id)
      .map((node) => node.resource.id as string);
    this.expandedGroups.set(new Set(ids));
  }

  private buildTree(resources: Resource[]): MenuNode[] {
    const active = resources.filter((resource) => resource.is_active !== false && !!resource.id);
    const nodes = new Map<string, MenuNode>();
    active.forEach((resource) => nodes.set(resource.id as string, { resource, children: [] }));

    const roots: MenuNode[] = [];
    nodes.forEach((node) => {
      const parentId = node.resource.parent_id;
      const parent = parentId ? nodes.get(parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sort = (list: MenuNode[]): MenuNode[] =>
      [...list]
        .sort(
          (a, b) =>
            (a.resource.weight ?? 0) - (b.resource.weight ?? 0) ||
            (a.resource.name ?? '').localeCompare(b.resource.name ?? ''),
        )
        .map((node) => ({ resource: node.resource, children: sort(node.children) }));

    return sort(roots);
  }
}
