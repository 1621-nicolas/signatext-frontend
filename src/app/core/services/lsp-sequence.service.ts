import { Injectable } from '@angular/core';

export interface LspSequenceMessage {
  idUsuario: number;
  tipo: string;
  contenido: string;
}

@Injectable({
  providedIn: 'root'
})
export class LspSequenceService {
  appendToken(sequence: string[], token: string, maxTokens = 12): string[] {
    const normalized = this.normalizeToken(token);

    if (!normalized || normalized === 'Configuración no identificada') {
      return sequence;
    }

    const last = sequence.at(-1);
    if (last === normalized) {
      return sequence;
    }

    return [...sequence, normalized].slice(-maxTokens);
  }

  buildRemoteSequence(
    messages: LspSequenceMessage[],
    ownUserId: number | undefined,
    maxTokens = 12
  ): string[] {
    let sequence: string[] = [];

    for (const message of messages) {
      if (message.tipo !== 'TRADUCCION') {
        continue;
      }

      if (ownUserId !== undefined && message.idUsuario === ownUserId) {
        continue;
      }

      sequence = this.appendToken(sequence, message.contenido, maxTokens);
    }

    return sequence;
  }

  buildDisplay(sequence: string[]): string {
    return sequence.join(' · ');
  }

  buildLiteralText(sequence: string[]): string {
    if (sequence.length === 0) {
      return '';
    }

    const text = sequence
      .map(token => token.replaceAll('_', ' ').trim())
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('es-PE');

    if (!text) {
      return '';
    }

    return `${text.charAt(0).toLocaleUpperCase('es-PE')}${text.slice(1)}.`;
  }

  private normalizeToken(token: string): string {
    return token
      .replace(/\s+/g, ' ')
      .trim();
  }
}
