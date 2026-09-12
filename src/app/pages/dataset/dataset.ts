import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  signal,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DrawingUtils,
  FilesetResolver,
  HandLandmarker
} from '@mediapipe/tasks-vision';
import { DatasetService } from '../../core/services/dataset.service';
import { DatasetFrame, LspSignDefinition, DatasetStatistics } from '../../core/models/dataset.models';

@Component({
  selector: 'app-dataset',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dataset.html',
  styleUrl: './dataset.css'
})
export class DatasetComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  label = '';
  participantId = '';
  dominantHand: 'Derecha' | 'Izquierda' = 'Derecha';
  captureDuration = 3;

  cameraStatus = signal('Cámara desactivada');
  modelStatus = signal('Sin inicializar');
  handStatus = signal('Sin manos detectadas');
  detectedHands = signal(0);
  cameraActive = signal(false);

  countdownValue = signal(0);
  countdownActive = signal(false);
  lastCapturedSampleId = signal('');

  // Catalog
  catalogCategories = signal<string[]>([]);
  selectedCategory = signal<string>('Alfabeto');
  searchQuery = signal('');
  selectedSign = signal<LspSignDefinition | null>(null);
  showCatalog = signal(true);

  filteredCatalog = computed(() => {
    const signs = this.datasetService.getSignsByCategory(this.selectedCategory());
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return signs;
    return signs.filter(s => s.label.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
  });

  stats = computed(() => this.datasetService.getStatistics());
  
  // Table Filtering
  tableSearchQuery = signal('');
  
  filteredSamples = computed(() => {
    const query = this.tableSearchQuery().toLowerCase().trim();
    const all = this.datasetService.samples();
    if (!query) return all;
    return all.filter(s => 
      s.label.toLowerCase().includes(query) || 
      s.participantId.toLowerCase().includes(query) ||
      s.id.toLowerCase().includes(query)
    );
  });

  private stream: MediaStream | null = null;
  private handLandmarker: HandLandmarker | null = null;
  private animationFrameId: number | null = null;
  private detectionRunning = false;
  private lastVideoTime = -1;
  private lastDetectionTime = 0;
  private readonly detectionInterval = 33;

  constructor(public readonly datasetService: DatasetService) {
    this.catalogCategories.set(this.datasetService.getCategories());
    if (this.catalogCategories().length > 0) {
      this.selectedCategory.set(this.catalogCategories()[0]);
    }
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initializeHandLandmarker();
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  selectSignFromCatalog(sign: LspSignDefinition): void {
    this.selectedSign.set(sign);
    this.label = sign.label;
    if (window.innerWidth < 900) {
      this.showCatalog.set(false);
    }
  }

  toggleCatalog(): void {
    this.showCatalog.set(!this.showCatalog());
  }

  getBadgeClass(category: string | undefined): string {
    if (!category) return 'badge-default';
    const cat = category.toLowerCase();
    if (cat === 'alfabeto') return 'badge-alpha';
    if (cat === 'números') return 'badge-numbers';
    if (cat === 'saludos') return 'badge-greetings';
    if (cat === 'emociones') return 'badge-emotions';
    return 'badge-default';
  }

  getCategoryForLabel(label: string): string {
    const cat = this.datasetService.getSignCatalog().find(s => s.label === label);
    return cat ? cat.category : 'Otros';
  }

  async toggleCamera(): Promise<void> {
    if (this.cameraActive()) {
      this.stopCamera();
    } else {
      await this.startCamera();
    }
  }

  async startCamera(): Promise<void> {
    if (this.stream) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraStatus.set('El navegador no permite utilizar la cámara');
      return;
    }

    try {
      this.cameraStatus.set('Solicitando permiso...');

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });

      const video = this.videoElement.nativeElement;
      video.srcObject = this.stream;
      await this.waitForMetadata(video);
      await video.play();

      this.cameraStatus.set('Cámara activa');
      this.cameraActive.set(true);
      this.startDetectionIfReady();
    } catch (error) {
      console.error('ERROR DE CÁMARA EN DATASET:', error);
      this.cameraStatus.set('No se pudo activar la cámara');
    }
  }

  stopCamera(): void {
    this.detectionRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }

    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }

    const canvas = this.canvasElement?.nativeElement;
    if (canvas) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    }

    this.detectedHands.set(0);
    this.handStatus.set('Sin manos detectadas');
    this.cameraStatus.set('Cámara desactivada');
    this.cameraActive.set(false);
  }

  canStartCapture(): boolean {
    return (
      this.cameraActive() &&
      !this.datasetService.isCapturing() &&
      !this.countdownActive() &&
      this.label.trim().length > 0 &&
      this.participantId.trim().length > 0
    );
  }

  async beginCapture(): Promise<void> {
    if (!this.canStartCapture()) {
      return;
    }

    this.countdownActive.set(true);
    this.lastCapturedSampleId.set('');

    for (let i = 3; i > 0; i--) {
      this.countdownValue.set(i);
      await this.delay(1000);
    }

    this.countdownValue.set(0);
    this.countdownActive.set(false);

    const video = this.videoElement?.nativeElement;
    const resolution = video
      ? { width: video.videoWidth, height: video.videoHeight }
      : { width: 640, height: 480 };

    this.datasetService.startCapture(
      this.label,
      this.participantId,
      this.dominantHand,
      this.captureDuration * 1000,
      resolution
    );
  }

  cancelCapture(): void {
    const sample = this.datasetService.stopCapture();
    if (sample) {
      this.lastCapturedSampleId.set(sample.id);
    }
  }

  getProgressPercent(): number {
    return Math.round(this.datasetService.captureProgress() * 100);
  }

  formatDuration(ms: number): string {
    return (ms / 1000).toFixed(1) + 's';
  }

  formatDate(isoString: string): string {
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      try {
        await this.datasetService.importFromJson(input.files[0]);
        alert('Datos importados correctamente');
      } catch (e) {
        alert('Error importando datos: ' + (e as Error).message);
      }
      input.value = '';
    }
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.handLandmarker?.close();
  }

  private async initializeHandLandmarker(): Promise<void> {
    try {
      this.modelStatus.set('Inicializando detector...');

      const vision = await FilesetResolver.forVisionTasks('/mediapipe-wasm');

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: '/models/hand_landmarker.task' },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.modelStatus.set('Detector listo');
      this.startDetectionIfReady();
    } catch (error) {
      console.error('ERROR MEDIAPIPE EN DATASET:', error);
      this.modelStatus.set('Error al cargar detector');
    }
  }

  private startDetectionIfReady(): void {
    const video = this.videoElement?.nativeElement;

    if (!video || !this.stream || !this.handLandmarker || this.detectionRunning) {
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    this.detectionRunning = true;
    this.detectHands();
  }

  private detectHands = (): void => {
    if (!this.detectionRunning) {
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context || !this.handLandmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.scheduleNextDetection();
      return;
    }

    const now = performance.now();

    if (now - this.lastDetectionTime < this.detectionInterval || video.currentTime === this.lastVideoTime) {
      this.scheduleNextDetection();
      return;
    }

    this.lastDetectionTime = now;
    this.lastVideoTime = video.currentTime;

    try {
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
      }
      if (canvas.height !== video.videoHeight) {
        canvas.height = video.videoHeight;
      }

      const results = this.handLandmarker.detectForVideo(video, now);
      const count = results.landmarks.length;

      context.clearRect(0, 0, canvas.width, canvas.height);
      this.detectedHands.set(count);

      if (count === 0) {
        this.handStatus.set('Sin manos detectadas');
      } else {
        this.handStatus.set(count === 1 ? 'Mano detectada' : 'Dos manos detectadas');
      }

      const drawingUtils = new DrawingUtils(context);

      for (const landmarks of results.landmarks) {
        drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { lineWidth: 3 });
        drawingUtils.drawLandmarks(landmarks, { radius: 4, lineWidth: 2 });
      }

      if (this.datasetService.isCapturing()) {
        const frame = this.buildFrame(results, now);
        this.datasetService.addFrame(frame);
      }
    } catch (error) {
      console.error('ERROR DETECTANDO MANOS EN DATASET:', error);
      this.handStatus.set('Error temporal de detección');
    }

    this.scheduleNextDetection();
  };

  private buildFrame(
    results: { landmarks: { x: number; y: number; z: number }[][]; handedness: { categoryName: string; score: number }[][] },
    timestamp: number
  ): DatasetFrame {
    let leftHand: number[] | null = null;
    let rightHand: number[] | null = null;
    let leftHandedness = 0;
    let rightHandedness = 0;

    for (let i = 0; i < results.landmarks.length; i++) {
      const landmarks = results.landmarks[i];
      const handInfo = results.handedness[i]?.[0];
      const side = handInfo?.categoryName ?? '';
      const confidence = handInfo?.score ?? 0;
      const normalized = this.normalizeLandmarks(landmarks);

      if (side === 'Left') {
        leftHand = normalized;
        leftHandedness = confidence;
      } else if (side === 'Right') {
        rightHand = normalized;
        rightHandedness = confidence;
      }
    }

    return { timestamp, leftHand, rightHand, leftHandedness, rightHandedness };
  }

  private normalizeLandmarks(landmarks: { x: number; y: number; z: number }[]): number[] {
    if (landmarks.length === 0) {
      return [];
    }

    const wrist = landmarks[0];
    const centered = landmarks.map(p => ({
      x: p.x - wrist.x,
      y: p.y - wrist.y,
      z: p.z - wrist.z
    }));

    let maxDistance = 0;
    for (const p of centered) {
      const d = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      if (d > maxDistance) {
        maxDistance = d;
      }
    }

    if (maxDistance < 0.000001) {
      maxDistance = 1;
    }

    const vector: number[] = [];
    for (const p of centered) {
      vector.push(
        Number((p.x / maxDistance).toFixed(4)),
        Number((p.y / maxDistance).toFixed(4)),
        Number((p.z / maxDistance).toFixed(4))
      );
    }

    return vector;
  }

  private scheduleNextDetection(): void {
    this.animationFrameId = requestAnimationFrame(this.detectHands);
  }

  private waitForMetadata(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve, reject) => {
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        resolve();
        return;
      }

      const onLoaded = () => { cleanup(); resolve(); };
      const onError = () => { cleanup(); reject(new Error('No se pudo preparar el video')); };
      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('error', onError);
      };

      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('error', onError);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
