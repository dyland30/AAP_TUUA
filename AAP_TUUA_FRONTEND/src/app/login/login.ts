import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
import { EntraAuthService } from '../services/entra-auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly entraAuth = inject(EntraAuthService);

  protected readonly year = new Date().getFullYear();
  protected readonly hidePassword = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [true],
  });

  ngOnInit(): void {
    this.completeCorporateLogin();
  }

  protected togglePassword(): void {
    this.hidePassword.update((value) => !value);
  }

  protected onSubmit(): void {
    if (this.isLoading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    const { email, password } = this.form.getRawValue();

    this.auth
      .authenticate({ email, password })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected async onCorporateLogin(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);
    try {
      await this.entraAuth.login();
    } catch (e) {
      console.error(e);
      this.isLoading.set(false);
      this.errorMessage.set('No se pudo iniciar sesión con tu cuenta corporativa.');
    }
  }

  /** Al volver del redirect de Entra ID, canjea el token por la sesión de la aplicación. */
  private async completeCorporateLogin(): Promise<void> {
    let accessToken: string | null;
    try {
      accessToken = await this.entraAuth.handleRedirect();
    } catch {
      this.errorMessage.set('No se pudo iniciar sesión con tu cuenta corporativa.');
      return;
    }
    if (!accessToken) {
      return;
    }

    this.isLoading.set(true);
    this.auth
      .authenticateWithEntra(accessToken)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: (error: HttpErrorResponse) => {
          void this.entraAuth.clearSession();
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private resolveError(error: HttpErrorResponse): string {
    if (typeof error.error === 'string') {
      return error.error;
    }
    if (error.status === 401 || error.status === 403) {
      return 'Tu cuenta corporativa no está habilitada en TUUA.';
    }
    if (error.status === 400) {
      return 'Usuario o contraseña incorrectos.';
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
