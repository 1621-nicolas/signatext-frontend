import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { MensajeSala } from './sala.service';

interface SalaRealtimeEvent {
  tipo: 'MENSAJE';
  mensaje: MensajeSala;
}

@Injectable({
  providedIn: 'root'
})
export class SalaRealtimeService {
  private readonly authService = inject(AuthService);
  private socket: WebSocket | null = null;
  private codigoActual: string | null = null;
  private reconnectTimer: number | null = null;
  private cerradoManual = false;

  conectar(
    codigo: string,
    onMensaje: (mensaje: MensajeSala) => void,
    onEstado?: (estado: string) => void
  ): void {
    this.desconectar();

    const token = this.authService.getToken();
    if (!token) {
      onEstado?.('Sin sesión');
      return;
    }

    this.codigoActual = codigo;
    this.cerradoManual = false;

    const abrir = () => {
      if (this.cerradoManual || !this.codigoActual) {
        return;
      }

      onEstado?.('Conectando...');

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = window.location.hostname || 'localhost';
      const url = `${protocol}://${host}:8081/ws/salas?codigo=${encodeURIComponent(this.codigoActual)}&token=${encodeURIComponent(token)}`;
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        onEstado?.('Tiempo real conectado');
      };

      this.socket.onmessage = event => {
        try {
          const payload = JSON.parse(event.data) as SalaRealtimeEvent;
          if (payload.tipo === 'MENSAJE' && payload.mensaje) {
            onMensaje(payload.mensaje);
          }
        } catch {
          onEstado?.('Error procesando actualización');
        }
      };

      this.socket.onerror = () => {
        onEstado?.('Error de conexión en tiempo real');
      };

      this.socket.onclose = () => {
        this.socket = null;

        if (this.cerradoManual) {
          onEstado?.('Tiempo real desconectado');
          return;
        }

        onEstado?.('Reconectando...');
        this.reconnectTimer = window.setTimeout(abrir, 1500);
      };
    };

    abrir();
  }

  desconectar(): void {
    this.cerradoManual = true;
    this.codigoActual = null;

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
