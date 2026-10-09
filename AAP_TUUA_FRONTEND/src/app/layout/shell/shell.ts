import { Component, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterOutlet } from '@angular/router';
import { Menu } from '../../menu/menu';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-shell',
  imports: [Menu, RouterOutlet, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly auth = inject(AuthenticationService);
  private readonly router = inject(Router);

  protected readonly menu = viewChild(Menu);
  protected readonly user = this.auth.getCurrentUser();

  protected logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
