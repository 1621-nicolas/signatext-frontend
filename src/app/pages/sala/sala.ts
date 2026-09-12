import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SalaCameraComponent } from '../../components/sala-camera/sala-camera';
import { AuthService } from '../../core/services/auth.service';
import { LspSequenceService } from '../../core/services/lsp-sequence.service';
import { SalaRealtimeService } from '../../core/services/sala-realtime.service';
import { MensajeSala, SalaPrivada, SalaService } from '../../core/services/sala.service';

@Component({
  selector: 'app-sala',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SalaCameraComponent],
  templateUrl: './sala.html',
  styleUrl: './sala.css'
})
export class SalaComponent implements OnDestroy {
  readonly authService = inject(AuthService);
  private readonly salaService = inject(SalaService);
  private readonly realtimeService = inject(SalaRealtimeService);
  private readonly lspSequenceService = inject(LspSequenceService);

  sala = signal<SalaPrivada | null>(null);
  mensajes = signal<MensajeSala[]>([]);
  cargando = signal(false);
  enviando = signal(false);
  error = signal('');
  aviso = signal('');
  realtimeStatus = signal('Desconectado');

  codigoIngreso = '';
  textoMensaje = '';

  private roomPollingId: number | null = null;
  private messageFallbackPollingId: number | null = null;

  crearSala(): void {
    if (!this.authService.isLoggedIn() || this.cargando()) {
      return;
    }

    this.error.set('');
    this.aviso.set('');
    this.cargando.set(true);

    this.salaService.crear().subscribe({
      next: sala => {
        this.cargando.set(false);
        this.entrarEnSala(sala);
        this.aviso.set('Sala creada. Comparte el código con la otra persona.');
      },
      error: response => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(response?.status));
      }
    });
  }

  unirseSala(): void {
    const codigo = this.codigoIngreso.replace(/\D/g, '').slice(0, 6);
    this.codigoIngreso = codigo;

    if (!this.authService.isLoggedIn() || codigo.length !== 6 || this.cargando()) {
      if (codigo.length !== 6) {
        this.error.set('Ingresa un código de sala de 6 dígitos.');
      }
      return;
    }

    this.error.set('');
    this.aviso.set('');
    this.cargando.set(true);

    this.salaService.unirse(codigo).subscribe({
      next: sala => {
        this.cargando.set(false);
        this.entrarEnSala(sala);
        this.aviso.set('Te uniste correctamente a la sala.');
      },
      error: response => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(response?.status));
      }
    });
  }

  enviar(tipo: 'TEXTO' | 'TRADUCCION' = 'TEXTO'): void {
    const sala = this.sala();
    const contenido = this.textoMensaje.trim();

    if (!sala || !contenido || this.enviando()) {
      return;
    }

    this.enviarContenido(contenido, tipo, true);
  }

  enviarTraduccionCamara(texto: string): void {
    const sala = this.sala();
    const contenido = texto.trim();

    if (!sala || !contenido) {
      return;
    }

    this.salaService.enviarMensaje(sala.codigo, contenido, 'TRADUCCION').subscribe({
      next: mensaje => this.agregarMensajeSiNoExiste(mensaje),
      error: response => {
        this.error.set(this.mensajeError(response?.status));
      }
    });
  }

  traduccionesRecibidas(): MensajeSala[] {
    return this.mensajes().filter(
      mensaje => mensaje.tipo === 'TRADUCCION' && !this.esMio(mensaje)
    );
  }

  secuenciaRemota(): string {
    return this.lspSequenceService.buildDisplay(this.tokensRemotos());
  }

  textoLiteralRemoto(): string {
    return this.lspSequenceService.buildLiteralText(this.tokensRemotos());
  }

  mensajesTexto(): MensajeSala[] {
    return this.mensajes().filter(mensaje => mensaje.tipo === 'TEXTO');
  }

  salirSala(): void {
    const sala = this.sala();

    if (!sala) {
      return;
    }

    this.salaService.salir(sala.codigo).subscribe({
      next: () => this.limpiarSala(),
      error: () => this.limpiarSala()
    });
  }

  copiarCodigo(): void {
    const codigo = this.sala()?.codigo;
    if (!codigo || !navigator.clipboard) {
      return;
    }

    navigator.clipboard.writeText(codigo).then(() => {
      this.aviso.set('Código copiado.');
    });
  }

  esMio(mensaje: MensajeSala): boolean {
    return mensaje.idUsuario === this.authService.usuario()?.idUsuario;
  }

  ngOnDestroy(): void {
    this.detenerPolling();
    this.realtimeService.desconectar();
  }

  private tokensRemotos(): string[] {
    return this.lspSequenceService.buildRemoteSequence(
      this.mensajes(),
      this.authService.usuario()?.idUsuario,
      12
    );
  }

  private enviarContenido(
    contenido: string,
    tipo: 'TEXTO' | 'TRADUCCION',
    limpiarTexto: boolean
  ): void {
    const sala = this.sala();

    if (!sala) {
      return;
    }

    this.error.set('');
    this.enviando.set(true);

    this.salaService.enviarMensaje(sala.codigo, contenido, tipo).subscribe({
      next: mensaje => {
        this.enviando.set(false);
        if (limpiarTexto) {
          this.textoMensaje = '';
        }
        this.agregarMensajeSiNoExiste(mensaje);
      },
      error: response => {
        this.enviando.set(false);
        this.error.set(this.mensajeError(response?.status));
      }
    });
  }

  private entrarEnSala(sala: SalaPrivada): void {
    this.sala.set(sala);
    this.codigoIngreso = sala.codigo;
    this.cargarMensajes();
    this.iniciarPollingParticipantes();
    this.iniciarPollingMensajesFallback();
    this.conectarTiempoReal(sala.codigo);
  }

  private conectarTiempoReal(codigo: string): void {
    this.realtimeService.conectar(
      codigo,
      mensaje => this.agregarMensajeSiNoExiste(mensaje),
      estado => {
        this.realtimeStatus.set(estado);

        if (estado === 'Tiempo real conectado') {
          this.detenerPollingMensajesFallback();
        } else {
          this.iniciarPollingMensajesFallback();
        }
      }
    );
  }

  private iniciarPollingParticipantes(): void {
    if (this.roomPollingId !== null) {
      return;
    }

    this.roomPollingId = window.setInterval(() => {
      this.actualizarSala();
    }, 1500);
  }

  private iniciarPollingMensajesFallback(): void {
    if (this.messageFallbackPollingId !== null) {
      return;
    }

    this.messageFallbackPollingId = window.setInterval(() => {
      this.cargarMensajes();
    }, 800);
  }

  private detenerPollingMensajesFallback(): void {
    if (this.messageFallbackPollingId !== null) {
      window.clearInterval(this.messageFallbackPollingId);
      this.messageFallbackPollingId = null;
    }
  }

  private detenerPolling(): void {
    if (this.roomPollingId !== null) {
      window.clearInterval(this.roomPollingId);
      this.roomPollingId = null;
    }

    this.detenerPollingMensajesFallback();
  }

  private actualizarSala(): void {
    const salaActual = this.sala();
    if (!salaActual) {
      return;
    }

    this.salaService.obtener(salaActual.codigo).subscribe({
      next: sala => this.sala.set(sala)
    });
  }

  private cargarMensajes(): void {
    const salaActual = this.sala();
    if (!salaActual) {
      return;
    }

    this.salaService.listarMensajes(salaActual.codigo).subscribe({
      next: mensajes => this.mensajes.set(mensajes)
    });
  }

  private agregarMensajeSiNoExiste(mensaje: MensajeSala): void {
    const actuales = this.mensajes();
    if (actuales.some(item => item.idMensaje === mensaje.idMensaje)) {
      return;
    }

    this.mensajes.set([...actuales, mensaje]);
  }

  private limpiarSala(): void {
    this.detenerPolling();
    this.realtimeService.desconectar();
    this.realtimeStatus.set('Desconectado');
    this.sala.set(null);
    this.mensajes.set([]);
    this.textoMensaje = '';
    this.codigoIngreso = '';
    this.error.set('');
    this.aviso.set('Saliste de la sala.');
  }

  private mensajeError(status?: number): string {
    if (status === 401 || status === 403) {
      return 'Tu sesión no es válida o no tienes acceso a esta sala.';
    }
    if (status === 404) {
      return 'No encontramos una sala con ese código.';
    }
    if (status === 409) {
      return 'La sala ya tiene dos participantes.';
    }
    if (status === 410) {
      return 'La sala ya fue cerrada.';
    }
    return 'No se pudo completar la operación. Verifica que el backend esté activo.';
  }
}
