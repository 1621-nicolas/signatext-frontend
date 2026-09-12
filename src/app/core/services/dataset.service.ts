import { Injectable, signal } from '@angular/core';
import { DatasetCollection, DatasetFrame, DatasetSample, LSP_CATALOG, LspSignDefinition, DatasetStatistics } from '../models/dataset.models';

@Injectable({ providedIn: 'root' })
export class DatasetService {
  private readonly storageKey = 'signatext_dataset_samples';

  readonly samples = signal<DatasetSample[]>(this.loadFromStorage());
  readonly isCapturing = signal(false);
  readonly currentFrameCount = signal(0);
  readonly captureProgress = signal(0);

  private captureBuffer: DatasetFrame[] = [];
  private captureStartTime = 0;
  private captureDurationMs = 0;
  private captureLabel = '';
  private captureParticipantId = '';
  private captureDominantHand: 'Derecha' | 'Izquierda' = 'Derecha';
  private captureTimerId: ReturnType<typeof setInterval> | null = null;
  private captureResolution = { width: 0, height: 0 };

  getSignCatalog(): LspSignDefinition[] {
    return LSP_CATALOG;
  }

  getSignsByCategory(category: string): LspSignDefinition[] {
    return LSP_CATALOG.filter(s => s.category === category);
  }

  getCategories(): string[] {
    return [...new Set(LSP_CATALOG.map(s => s.category))];
  }

  getStatistics(): DatasetStatistics {
    const currentSamples = this.samples();
    const byLabel: Record<string, number> = {};
    const byParticipant: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let totalFrames = 0;

    for (const s of currentSamples) {
      totalFrames += s.totalFrames;
      byLabel[s.label] = (byLabel[s.label] || 0) + 1;
      byParticipant[s.participantId] = (byParticipant[s.participantId] || 0) + 1;
      
      const catalogDef = LSP_CATALOG.find(c => c.label === s.label);
      if (catalogDef) {
        byCategory[catalogDef.category] = (byCategory[catalogDef.category] || 0) + 1;
      } else {
        byCategory['Otros'] = (byCategory['Otros'] || 0) + 1;
      }
    }

    return {
      totalSamples: currentSamples.length,
      totalFrames,
      uniqueLabels: Object.keys(byLabel).length,
      uniqueParticipants: Object.keys(byParticipant).length,
      byLabel,
      byParticipant,
      byCategory
    };
  }

  startCapture(
    label: string,
    participantId: string,
    dominantHand: 'Derecha' | 'Izquierda',
    durationMs: number,
    resolution: { width: number; height: number }
  ): void {
    if (this.isCapturing()) {
      return;
    }

    this.captureBuffer = [];
    this.captureStartTime = performance.now();
    this.captureDurationMs = durationMs;
    this.captureLabel = label.trim().toUpperCase();
    this.captureParticipantId = participantId.trim().toUpperCase();
    this.captureDominantHand = dominantHand;
    this.captureResolution = resolution;

    this.currentFrameCount.set(0);
    this.captureProgress.set(0);
    this.isCapturing.set(true);

    this.captureTimerId = setInterval(() => {
      const elapsed = performance.now() - this.captureStartTime;
      const progress = Math.min(elapsed / this.captureDurationMs, 1);
      this.captureProgress.set(progress);

      if (elapsed >= this.captureDurationMs) {
        this.finishCapture();
      }
    }, 50);
  }

  addFrame(frame: DatasetFrame): void {
    if (!this.isCapturing()) {
      return;
    }

    this.captureBuffer.push(frame);
    this.currentFrameCount.set(this.captureBuffer.length);
  }

  stopCapture(): DatasetSample | null {
    if (!this.isCapturing()) {
      return null;
    }
    return this.finishCapture();
  }

  deleteSample(id: string): void {
    const updated = this.samples().filter(s => s.id !== id);
    this.samples.set(updated);
    this.saveToStorage(updated);
  }

  exportAsJson(): void {
    const collection: DatasetCollection = {
      projectName: 'SignaText-LSP',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      samples: this.samples()
    };

    const json = JSON.stringify(collection, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const filename = `signatext-dataset-${this.formatDateForFilename()}.json`;
    this.downloadBlob(blob, filename);
  }

  exportSingleSample(id: string): void {
    const sample = this.samples().find(s => s.id === id);
    if (!sample) {
      return;
    }

    const json = JSON.stringify(sample, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const filename = `${sample.id}.json`;
    this.downloadBlob(blob, filename);
  }

  importFromJson(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          
          let importedSamples: DatasetSample[] = [];
          if (parsed.samples && Array.isArray(parsed.samples)) {
            importedSamples = parsed.samples;
          } else if (Array.isArray(parsed)) {
            importedSamples = parsed;
          }
          
          if (importedSamples.length > 0) {
            const currentSamples = this.samples();
            const idSet = new Set(currentSamples.map(s => s.id));
            const newSamples = importedSamples.filter(s => !idSet.has(s.id));
            
            const updated = [...currentSamples, ...newSamples];
            this.samples.set(updated);
            this.saveToStorage(updated);
            resolve();
          } else {
            reject(new Error('Formato inválido'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file);
    });
  }

  clearAll(): void {
    this.samples.set([]);
    this.saveToStorage([]);
  }

  getSampleCountForLabel(label: string): number {
    const normalized = label.trim().toUpperCase();
    return this.samples().filter(s => s.label === normalized).length;
  }

  getNextSampleNumber(label: string, participantId: string): number {
    const normalizedLabel = label.trim().toUpperCase();
    const normalizedParticipant = participantId.trim().toUpperCase();
    const existing = this.samples().filter(
      s => s.label === normalizedLabel && s.participantId === normalizedParticipant
    );
    return existing.length + 1;
  }

  private finishCapture(): DatasetSample {
    if (this.captureTimerId !== null) {
      clearInterval(this.captureTimerId);
      this.captureTimerId = null;
    }

    const endTime = performance.now();
    const durationMs = Math.round(endTime - this.captureStartTime);
    const sampleNumber = this.getNextSampleNumber(this.captureLabel, this.captureParticipantId);
    const id = `${this.captureLabel}_${this.captureParticipantId}_${String(sampleNumber).padStart(3, '0')}`;

    const sample: DatasetSample = {
      id,
      label: this.captureLabel,
      participantId: this.captureParticipantId,
      dominantHand: this.captureDominantHand,
      sampleNumber,
      frames: this.captureBuffer.map(f => ({
        ...f,
        timestamp: Math.round(f.timestamp - this.captureStartTime)
      })),
      totalFrames: this.captureBuffer.length,
      durationMs,
      capturedAt: new Date().toISOString(),
      metadata: {
        resolution: this.captureResolution,
        userAgent: navigator.userAgent
      }
    };

    const updated = [...this.samples(), sample];
    this.samples.set(updated);
    this.saveToStorage(updated);

    this.captureBuffer = [];
    this.isCapturing.set(false);
    this.currentFrameCount.set(0);
    this.captureProgress.set(0);

    return sample;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  private formatDateForFilename(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}-${hours}${minutes}`;
  }

  private saveToStorage(samples: DatasetSample[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(samples));
    } catch {
      console.warn('No se pudo guardar el dataset en localStorage (posible límite de espacio)');
      // If error occurs, we could implement LRU or something, but standard is to ignore or notify
      // for now, we just proceed.
    }
  }

  private loadFromStorage(): DatasetSample[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return [];
      }
      return JSON.parse(data) as DatasetSample[];
    } catch {
      return [];
    }
  }
}
