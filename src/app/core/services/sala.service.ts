import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ParticipanteSala {
  idUsuario: number;
  nombre: string;
}

export interface SalaPrivada {
  idSala: number;
  codigo: string;
  estado: string;
  fechaCreacion: string;
  participantes: ParticipanteSala[];
}

export interface MensajeSala {
  idMensaje: number;
  idUsuario: number;
  nombre: string;
  contenido: string;
  tipo: 'TEXTO' | 'TRADUCCION';
  fecha: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalaService {
  private readonly backendProtocol = window.location.protocol === 'https:' ? 'https' : 'http';
  private readonly backendHost = window.location.hostname || 'localhost';
  private readonly apiUrl = `${this.backendProtocol}://${this.backendHost}:8081/api/salas`;

  constructor(private readonly http: HttpClient) {}

  crear(): Observable<SalaPrivada> {
    return this.http.post<SalaPrivada>(this.apiUrl, {});
  }

  unirse(codigo: string): Observable<SalaPrivada> {
    return this.http.post<SalaPrivada>(`${this.apiUrl}/unirse`, { codigo });
  }

  obtener(codigo: string): Observable<SalaPrivada> {
    return this.http.get<SalaPrivada>(`${this.apiUrl}/${codigo}`);
  }

  salir(codigo: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${codigo}/salir`, {});
  }

  listarMensajes(codigo: string): Observable<MensajeSala[]> {
    return this.http.get<MensajeSala[]>(`${this.apiUrl}/${codigo}/mensajes`);
  }

  enviarMensaje(
    codigo: string,
    contenido: string,
    tipo: 'TEXTO' | 'TRADUCCION' = 'TEXTO'
  ): Observable<MensajeSala> {
    return this.http.post<MensajeSala>(`${this.apiUrl}/${codigo}/mensajes`, {
      contenido,
      tipo
    });
  }
}
