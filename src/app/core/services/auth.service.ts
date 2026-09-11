import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  token: string;
  idUsuario: number;
  nombre: string;
  correo: string;
}

export interface RegistroRequest {
  nombre: string;
  correo: string;
  password: string;
}

export interface LoginRequest {
  correo: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly backendProtocol = window.location.protocol === 'https:' ? 'https' : 'http';
  private readonly backendHost = window.location.hostname || 'localhost';
  private readonly apiUrl = `${this.backendProtocol}://${this.backendHost}:8081/api/auth`;

  private readonly usuarioSignal = signal<AuthResponse | null>(
    this.readStoredUser()
  );

  usuario = this.usuarioSignal.asReadonly();

  constructor(private readonly http: HttpClient) {}

  registrar(request: RegistroRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, request)
      .pipe(tap(response => this.saveSession(response)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, request)
      .pipe(tap(response => this.saveSession(response)));
  }

  logout(): void {
    localStorage.removeItem('signatext_token');
    localStorage.removeItem('signatext_usuario');
    this.usuarioSignal.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('signatext_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem('signatext_token', response.token);
    localStorage.setItem('signatext_usuario', JSON.stringify(response));
    this.usuarioSignal.set(response);
  }

  private readStoredUser(): AuthResponse | null {
    const raw = localStorage.getItem('signatext_usuario');

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthResponse;
    } catch {
      localStorage.removeItem('signatext_usuario');
      return null;
    }
  }
}
