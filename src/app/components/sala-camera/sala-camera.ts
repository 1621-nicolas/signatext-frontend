import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
  signal
} from '@angular/core';
import {
  DrawingUtils,
  FilesetResolver,
  HandLandmarker
} from '@mediapipe/tasks-vision';

@Component({
  selector: 'app-sala-camera',
  standalone: true,
  templateUrl: './sala-camera.html',
  styleUrl: './sala-camera.css'
})
export class SalaCameraComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video')
  videoElement!: ElementRef<HTMLVideoElement>;

  @ViewChild('canvas')
  canvasElement!: ElementRef<HTMLCanvasElement>;

  @Output()
  translationSent = new EventEmitter<string>();

  cameraStatus = signal('Cámara desactivada');
  modelStatus = signal('Cargando detector...');
  handStatus = signal('Sin manos detectadas');
  detectedHands = signal(0);
  currentTranslation = signal('');
  transmissionStatus = signal('Esperando una seña...');

  private stream: MediaStream | null = null;
  private handLandmarker: HandLandmarker | null = null;
  private animationFrameId: number | null = null;
  private detectionRunning = false;
  private lastVideoTime = -1;
  private lastDetectionTime = 0;
  private lastEmittedTranslation = '';
  private recentTranslations: string[] = [];

  private readonly detectionInterval = 50;
  private readonly consensusWindow = 5;
  private readonly consensusRequired = 3;

  async ngAfterViewInit(): Promise<void> {
    await this.initializeHandLandmarker();
  }

  async startCamera(): Promise<void> {
    if (this.stream) {
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        this.cameraStatus.set('El navegador no permite utilizar la cámara');
        return;
      }

      this.cameraStatus.set('Solicitando permiso...');

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      const video = this.videoElement.nativeElement;
      video.srcObject = this.stream;
      await this.waitForMetadata(video);
      await video.play();

      this.cameraStatus.set('Cámara activa');
      this.transmissionStatus.set('Esperando una seña...');
      this.startDetectionIfReady();
    } catch (error) {
      console.error('ERROR DE CÁMARA EN SALA:', error);
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

    this.resetRecognition();
    this.cameraStatus.set('Cámara desactivada');
    this.transmissionStatus.set('Transmisión detenida');
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.handLandmarker?.close();
  }

  private async initializeHandLandmarker(): Promise<void> {
    try {
      const vision = await FilesetResolver.forVisionTasks('/mediapipe-wasm');

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/hand_landmarker.task'
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.modelStatus.set('Detector listo');
      this.startDetectionIfReady();
    } catch (error) {
      console.error('ERROR MEDIAPIPE EN SALA:', error);
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

    if (
      now - this.lastDetectionTime < this.detectionInterval ||
      video.currentTime === this.lastVideoTime
    ) {
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
        this.currentTranslation.set('');
        this.recentTranslations = [];
        this.lastEmittedTranslation = '';
        this.transmissionStatus.set('Esperando una seña...');
      } else {
        this.handStatus.set(count === 1 ? 'Mano detectada' : 'Dos manos detectadas');

        const displayLabels: string[] = [];
        const semanticLabels: string[] = [];

        results.landmarks.forEach((landmarks, index) => {
          const side = results.handedness[index]?.[0]?.categoryName === 'Left'
            ? 'Izquierda'
            : 'Derecha';
          const shape = this.classifyHand(landmarks);

          displayLabels.push(`${side}: ${shape}`);
          semanticLabels.push(shape);
        });

        const displayTranslation = displayLabels.join(' · ');
        const semanticTranslation = semanticLabels.sort().join(' + ');

        this.currentTranslation.set(displayTranslation);
        this.processAutomaticTranslation(semanticTranslation);
      }

      const drawingUtils = new DrawingUtils(context);

      for (const landmarks of results.landmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          HandLandmarker.HAND_CONNECTIONS,
          { lineWidth: 3 }
        );
        drawingUtils.drawLandmarks(landmarks, {
          radius: 4,
          lineWidth: 2
        });
      }
    } catch (error) {
      console.error('ERROR DETECTANDO MANOS EN SALA:', error);
      this.handStatus.set('Error temporal de detección');
    }

    this.scheduleNextDetection();
  };

  private processAutomaticTranslation(translation: string): void {
    if (!translation) {
      return;
    }

    this.recentTranslations.push(translation);

    if (this.recentTranslations.length > this.consensusWindow) {
      this.recentTranslations.shift();
    }

    const counts = new Map<string, number>();
    for (const item of this.recentTranslations) {
      counts.set(item, (counts.get(item) ?? 0) + 1);
    }

    let winner = '';
    let winnerCount = 0;

    for (const [item, count] of counts) {
      if (count > winnerCount) {
        winner = item;
        winnerCount = count;
      }
    }

    if (winnerCount < this.consensusRequired) {
      this.transmissionStatus.set('Confirmando seña...');
      return;
    }

    if (winner === this.lastEmittedTranslation) {
      this.transmissionStatus.set('Traducción compartida en tiempo real');
      return;
    }

    this.lastEmittedTranslation = winner;
    this.transmissionStatus.set('Traducción compartida en tiempo real');
    this.translationSent.emit(winner);
  }

  private resetRecognition(): void {
    this.detectedHands.set(0);
    this.currentTranslation.set('');
    this.handStatus.set('Sin manos detectadas');
    this.recentTranslations = [];
    this.lastEmittedTranslation = '';
  }

  private classifyHand(
    landmarks: { x: number; y: number; z: number }[]
  ): string {
    const thumb = Math.abs(landmarks[4].x - landmarks[2].x) > 0.08;
    const index = landmarks[8].y < landmarks[6].y;
    const middle = landmarks[12].y < landmarks[10].y;
    const ring = landmarks[16].y < landmarks[14].y;
    const pinky = landmarks[20].y < landmarks[18].y;
    const states = [thumb, index, middle, ring, pinky];
    const count = states.filter(Boolean).length;

    if (count === 5) {
      return 'Mano abierta';
    }

    if (count === 0) {
      return 'Puño';
    }

    if (index && !thumb && !middle && !ring && !pinky) {
      return 'Índice levantado';
    }

    if (index && middle && !thumb && !ring && !pinky) {
      return 'Dos dedos';
    }

    if (thumb && !index && !middle && !ring && !pinky) {
      return 'Pulgar extendido';
    }

    if (thumb && index && !middle && !ring && !pinky) {
      return 'Pulgar e índice extendidos';
    }

    if (index && middle && ring && !pinky) {
      return 'Tres dedos';
    }

    if (!thumb && index && middle && ring && pinky) {
      return 'Cuatro dedos';
    }

    return 'Configuración no identificada';
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

      const onLoaded = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error('No se pudo preparar el video'));
      };

      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('error', onError);
      };

      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('error', onError);
    });
  }
}
