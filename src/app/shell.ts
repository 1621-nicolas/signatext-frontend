import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.css'
})
export class ShellComponent {
  constructor(
    public readonly authService: AuthService,
    private readonly router: Router
  ) {}

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigateByUrl('/inicio');
  }
}
