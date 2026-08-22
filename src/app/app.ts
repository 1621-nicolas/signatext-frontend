import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  signal
} from '@angular/core';
import {
  DrawingUtils,
  FilesetResolver,
  HandLandmarker
} from '@mediapipe/tasks-vision';
interface HandPoint {
  id: number;
  x: number;
  y: number;
  z: number;
}
interface SpatialPoint {
  x: number;
  y: number;
  z: number;
}
interface FingerStates {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}
interface HandAnalysis {
  detected: boolean;
  side: string;
  confidence: number;
  coordinates: HandPoint[];
  normalizedCoordinates: HandPoint[];
  fingerStates: FingerStates;
  extendedFingerCount: number;
  handShape: string;
  center: SpatialPoint;
}
interface MotionPoint {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}
interface HandMotion {
  moving: boolean;
  direction: string;
  speed: number;
  dx: number;
  dy: number;
  dz: number;
  distance: number;
}
type KnownHandSide =
  'Izquierda' |
  'Derecha';
@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('video')
  videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas')
  canvasElement!: ElementRef<HTMLCanvasElement>;
  cameraStatus =
    signal('Cámara desactivada');
  modelStatus =
    signal('Cargando detector...');
  handStatus =
    signal('Sin manos detectadas');
  detectedHands =
    signal(0);
  handSide =
    signal('---');
  handConfidence =
    signal(0);
  handCoordinates =
    signal<HandPoint[]>([]);
  normalizedCoordinates =
    signal<HandPoint[]>([]);
  fingerStates =
    signal<FingerStates>(
      this.createEmptyFingerStates()
    );
  extendedFingerCount =
    signal(0);
  handShape =
    signal('Sin analizar');
  leftHand =
    signal<HandAnalysis>(
      this.createEmptyHand('Izquierda')
    );
  rightHand =
    signal<HandAnalysis>(
      this.createEmptyHand('Derecha')
    );
  detectedHandAnalyses =
    signal<HandAnalysis[]>([]);
  combinedNormalizedVector =
    signal<number[]>([]);
  interHandDistance =
    signal(0);
  leftHandMotion =
    signal<HandMotion>(
      this.createEmptyMotion()
    );
  rightHandMotion =
    signal<HandMotion>(
      this.createEmptyMotion()
    );
  leftTrajectory =
    signal<MotionPoint[]>([]);
  rightTrajectory =
    signal<MotionPoint[]>([]);
  combinedFeatureVector =
    signal<number[]>([]);
  private stream:
    MediaStream | null = null;
  private handLandmarker:
    HandLandmarker | null = null;
  private animationFrameId:
    number | null = null;
  private detectionRunning =
    false;
  private lastVideoTime =
    -1;
  private lastDetectionTime =
    0;
  private readonly detectionInterval =
    33;
  private readonly movementSpeedThreshold =
    0.08;
  private readonly trajectoryLimit =
    45;
  private readonly motionAlpha =
    0.35;
  private previousCenters: Record<
    KnownHandSide,
    MotionPoint | null
  > = {
    Izquierda: null,
    Derecha: null
  };
  private previousMotions: Record<
    KnownHandSide,
    HandMotion
  > = {
    Izquierda: this.createEmptyMotion(),
    Derecha: this.createEmptyMotion()
  };
  async ngAfterViewInit():
    Promise<void> {
    await this.initializeHandLandmarker();
  }
  private createEmptyFingerStates():
    FingerStates {
    return {
      thumb: false,
      index: false,
      middle: false,
      ring: false,
      pinky: false
    };
  }
  private createEmptyMotion():
    HandMotion {
    return {
      moving: false,
      direction: 'Estable',
      speed: 0,
      dx: 0,
      dy: 0,
      dz: 0,
      distance: 0
    };
  }
  private createEmptyHand(
    side: string
  ): HandAnalysis {
    return {
      detected: false,
      side,
      confidence: 0,
      coordinates: [],
      normalizedCoordinates: [],
      fingerStates:
        this.createEmptyFingerStates(),
      extendedFingerCount: 0,
      handShape: 'Sin analizar',
      center: {
        x: 0,
        y: 0,
        z: 0
      }
    };
  }
  private async initializeHandLandmarker():
    Promise<void> {
    try {
      this.modelStatus.set(
        'Inicializando detector...'
      );
      const vision =
        await FilesetResolver.forVisionTasks(
          '/mediapipe-wasm'
        );
      this.handLandmarker =
        await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath:
                '/models/hand_landmarker.task'
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          }
        );
      this.modelStatus.set(
        'Detector listo'
      );
      this.startDetectionIfReady();
    } catch (error) {
      console.error(
        'ERROR MEDIAPIPE:',
        error
      );
      this.modelStatus.set(
        'Error al cargar el detector'
      );
    }
  }
  async startCamera():
    Promise<void> {
    try {
      if (this.stream) {
        return;
      }
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        this.cameraStatus.set(
          'El navegador no permite utilizar la cámara'
        );
        return;
      }
      this.cameraStatus.set(
        'Solicitando permiso...'
      );
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: {
              ideal: 640
            },
            height: {
              ideal: 480
            },
            facingMode: 'user'
          },
          audio: false
        });
      this.stream =
        stream;
      const video =
        this.videoElement.nativeElement;
      video.srcObject =
        stream;
      await this.waitForVideoMetadata(
        video
      );
      await video.play();
      this.cameraStatus.set(
        'Cámara activa'
      );
      this.startDetectionIfReady();
    } catch (error) {
      console.error(
        'ERROR DE CÁMARA:',
        error
      );
      this.cameraStatus.set(
        'Error al activar la cámara'
      );
    }
  }
  private waitForVideoMetadata(
    video: HTMLVideoElement
  ): Promise<void> {
    return new Promise(
      (resolve, reject) => {
        if (
          video.readyState >=
          HTMLMediaElement.HAVE_METADATA
        ) {
          resolve();
          return;
        }
        const metadataHandler =
          () => {
            cleanup();
            resolve();
          };
        const errorHandler =
          () => {
            cleanup();
            reject(
              new Error(
                'No se pudieron cargar los datos del video'
              )
            );
          };
        const cleanup =
          () => {
            video.removeEventListener(
              'loadedmetadata',
              metadataHandler
            );
            video.removeEventListener(
              'error',
              errorHandler
            );
          };
        video.addEventListener(
          'loadedmetadata',
          metadataHandler
        );
        video.addEventListener(
          'error',
          errorHandler
        );
      }
    );
  }
  private startDetectionIfReady():
    void {
    const video =
      this.videoElement?.nativeElement;
    if (!video) {
      return;
    }
    if (!this.stream) {
      return;
    }
    if (!this.handLandmarker) {
      this.handStatus.set(
        'Esperando detector...'
      );
      return;
    }
    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      return;
    }
    if (this.detectionRunning) {
      return;
    }
    this.detectionRunning =
      true;
    this.handStatus.set(
      'Buscando manos...'
    );
    this.detectHands();
  }
  private detectHands =
    (): void => {
      if (!this.detectionRunning) {
        return;
      }
      const video =
        this.videoElement.nativeElement;
      const canvas =
        this.canvasElement.nativeElement;
      const context =
        canvas.getContext('2d');
      if (
        !context ||
        !this.handLandmarker ||
        video.readyState <
        HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        this.scheduleNextDetection();
        return;
      }
      const now =
        performance.now();
      if (
        now -
        this.lastDetectionTime <
        this.detectionInterval
      ) {
        this.scheduleNextDetection();
        return;
      }
      this.lastDetectionTime =
        now;
      if (
        video.currentTime ===
        this.lastVideoTime
      ) {
        this.scheduleNextDetection();
        return;
      }
      this.lastVideoTime =
        video.currentTime;
      try {
        if (
          canvas.width !==
          video.videoWidth
        ) {
          canvas.width =
            video.videoWidth;
        }
        if (
          canvas.height !==
          video.videoHeight
        ) {
          canvas.height =
            video.videoHeight;
        }
        const results =
          this.handLandmarker.detectForVideo(
            video,
            now
          );
        context.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const cantidad =
          results.landmarks.length;
        this.detectedHands.set(
          cantidad
        );
        const analyses:
          HandAnalysis[] = [];
        for (
          let index = 0;
          index < cantidad;
          index++
        ) {
          const landmarks =
            results.landmarks[index];
          const handedness =
            results.handedness[index]?.[0];
          const analysis =
            this.createHandAnalysis(
              landmarks,
              handedness?.categoryName ??
                'Desconocida',
              handedness?.score ??
                0
            );
          analyses.push(
            analysis
          );
        }
        this.detectedHandAnalyses.set(
          analyses
        );
        this.updateHands(
          analyses
        );
        this.updatePrimaryHand(
          analyses
        );
        this.updateCombinedVector();
        this.updateInterHandDistance();
        this.updateMotionTracking(
          analyses,
          now
        );
        this.updateCombinedFeatureVector();
        if (cantidad === 0) {
          this.handStatus.set(
            'Sin manos detectadas'
          );
        } else if (
          cantidad === 1
        ) {
          this.handStatus.set(
            'Mano detectada'
          );
        } else {
          this.handStatus.set(
            'Dos manos detectadas'
          );
        }
        const drawingUtils =
          new DrawingUtils(
            context
          );
        for (
          const landmarks
          of results.landmarks
        ) {
          drawingUtils.drawConnectors(
            landmarks,
            HandLandmarker.HAND_CONNECTIONS,
            {
              lineWidth: 3
            }
          );
          drawingUtils.drawLandmarks(
            landmarks,
            {
              radius: 4,
              lineWidth: 2
            }
          );
        }
      } catch (error) {
        console.error(
          'ERROR DETECTANDO MANOS:',
          error
        );
        this.handStatus.set(
          'Error temporal de detección'
        );
      }
      this.scheduleNextDetection();
    };
  private createHandAnalysis(
    landmarks: {
      x: number;
      y: number;
      z: number;
    }[],
    side: string,
    confidence: number
  ): HandAnalysis {
    const coordinates:
      HandPoint[] =
      landmarks.map(
        (point, index) => ({
          id: index,
          x: Number(
            point.x.toFixed(4)
          ),
          y: Number(
            point.y.toFixed(4)
          ),
          z: Number(
            point.z.toFixed(4)
          )
        })
      );
    const normalized =
      this.normalizeHand(
        landmarks
      );
    const fingerAnalysis =
      this.getFingerAnalysis(
        normalized
      );
    const center =
      this.getPalmCenter(
        landmarks
      );
    return {
      detected: true,
      side:
        this.translateHandSide(
          side
        ),
      confidence:
        Number(
          (
            confidence *
            100
          ).toFixed(1)
        ),
      coordinates,
      normalizedCoordinates:
        normalized,
      fingerStates:
        fingerAnalysis.states,
      extendedFingerCount:
        fingerAnalysis.count,
      handShape:
        fingerAnalysis.shape,
      center
    };
  }
  private getPalmCenter(
    landmarks: {
      x: number;
      y: number;
      z: number;
    }[]
  ): SpatialPoint {
    const indexes =
      [0, 5, 9, 13, 17];
    let x = 0;
    let y = 0;
    let z = 0;
    for (
      const index
      of indexes
    ) {
      x +=
        landmarks[index].x;
      y +=
        landmarks[index].y;
      z +=
        landmarks[index].z;
    }
    return {
      x:
        x /
        indexes.length,
      y:
        y /
        indexes.length,
      z:
        z /
        indexes.length
    };
  }
  private translateHandSide(
    side: string
  ): string {
    if (
      side === 'Left'
    ) {
      return 'Izquierda';
    }
    if (
      side === 'Right'
    ) {
      return 'Derecha';
    }
    return side;
  }
  private updateHands(
    analyses: HandAnalysis[]
  ): void {
    let left =
      this.createEmptyHand(
        'Izquierda'
      );
    let right =
      this.createEmptyHand(
        'Derecha'
      );
    for (
      const hand
      of analyses
    ) {
      if (
        hand.side ===
        'Izquierda'
      ) {
        left =
          hand;
      } else if (
        hand.side ===
        'Derecha'
      ) {
        right =
          hand;
      }
    }
    this.leftHand.set(
      left
    );
    this.rightHand.set(
      right
    );
  }
  private updatePrimaryHand(
    analyses: HandAnalysis[]
  ): void {
    if (
      analyses.length === 0
    ) {
      this.resetPrimaryHand();
      return;
    }
    const primary =
      analyses[0];
    this.handSide.set(
      primary.side
    );
    this.handConfidence.set(
      primary.confidence
    );
    this.handCoordinates.set(
      primary.coordinates
    );
    this.normalizedCoordinates.set(
      primary.normalizedCoordinates
    );
    this.fingerStates.set(
      primary.fingerStates
    );
    this.extendedFingerCount.set(
      primary.extendedFingerCount
    );
    this.handShape.set(
      primary.handShape
    );
  }
  private updateCombinedVector():
    void {
    const leftVector =
      this.handToVector(
        this.leftHand()
      );
    const rightVector =
      this.handToVector(
        this.rightHand()
      );
    this.combinedNormalizedVector.set(
      [
        ...leftVector,
        ...rightVector
      ]
    );
  }
  private handToVector(
    hand: HandAnalysis
  ): number[] {
    if (
      !hand.detected ||
      hand.normalizedCoordinates.length !==
      21
    ) {
      return new Array(
        63
      ).fill(0);
    }
    const vector:
      number[] = [];
    for (
      const point
      of hand.normalizedCoordinates
    ) {
      vector.push(
        point.x,
        point.y,
        point.z
      );
    }
    return vector;
  }
  private updateInterHandDistance():
    void {
    const left =
      this.leftHand();
    const right =
      this.rightHand();
    if (
      !left.detected ||
      !right.detected
    ) {
      this.interHandDistance.set(
        0
      );
      return;
    }
    const distance =
      Math.sqrt(
        (
          right.center.x -
          left.center.x
        ) ** 2 +
        (
          right.center.y -
          left.center.y
        ) ** 2 +
        (
          right.center.z -
          left.center.z
        ) ** 2
      );
    this.interHandDistance.set(
      Number(
        distance.toFixed(4)
      )
    );
  }
  private updateMotionTracking(
    analyses: HandAnalysis[],
    timestamp: number
  ): void {
    const left =
      analyses.find(
        hand =>
          hand.side ===
          'Izquierda'
      );
    const right =
      analyses.find(
        hand =>
          hand.side ===
          'Derecha'
      );
    if (left) {
      const motion =
        this.calculateMotion(
          'Izquierda',
          left.center,
          timestamp
        );
      this.leftHandMotion.set(
        motion
      );
      this.addTrajectoryPoint(
        'Izquierda',
        left.center,
        timestamp
      );
    } else {
      this.leftHandMotion.set(
        this.createEmptyMotion()
      );
      this.previousCenters.Izquierda =
        null;
      this.previousMotions.Izquierda =
        this.createEmptyMotion();
    }
    if (right) {
      const motion =
        this.calculateMotion(
          'Derecha',
          right.center,
          timestamp
        );
      this.rightHandMotion.set(
        motion
      );
      this.addTrajectoryPoint(
        'Derecha',
        right.center,
        timestamp
      );
    } else {
      this.rightHandMotion.set(
        this.createEmptyMotion()
      );
      this.previousCenters.Derecha =
        null;
      this.previousMotions.Derecha =
        this.createEmptyMotion();
    }
  }
  private calculateMotion(
    side: KnownHandSide,
    center: SpatialPoint,
    timestamp: number
  ): HandMotion {
    const previous =
      this.previousCenters[
        side
      ];
    const current:
      MotionPoint = {
        x: center.x,
        y: center.y,
        z: center.z,
        timestamp
      };
    this.previousCenters[
      side
    ] = current;
    if (!previous) {
      const empty =
        this.createEmptyMotion();
      this.previousMotions[
        side
      ] = empty;
      return empty;
    }
    const elapsed =
      (
        timestamp -
        previous.timestamp
      ) /
      1000;
    if (
      elapsed <= 0
    ) {
      return this.createEmptyMotion();
    }
    const rawDx =
      center.x -
      previous.x;
    const rawDy =
      center.y -
      previous.y;
    const rawDz =
      center.z -
      previous.z;
    const previousMotion =
      this.previousMotions[
        side
      ];
    const dx =
      (
        previousMotion.dx *
        (
          1 -
          this.motionAlpha
        )
      ) +
      (
        rawDx *
        this.motionAlpha
      );
    const dy =
      (
        previousMotion.dy *
        (
          1 -
          this.motionAlpha
        )
      ) +
      (
        rawDy *
        this.motionAlpha
      );
    const dz =
      (
        previousMotion.dz *
        (
          1 -
          this.motionAlpha
        )
      ) +
      (
        rawDz *
        this.motionAlpha
      );
    const distance =
      Math.sqrt(
        dx ** 2 +
        dy ** 2 +
        dz ** 2
      );
    const speed =
      distance /
      elapsed;
    const moving =
      speed >=
      this.movementSpeedThreshold;
    const direction =
      moving
        ? this.getMovementDirection(
            dx,
            dy,
            dz
          )
        : 'Estable';
    const motion:
      HandMotion = {
        moving,
        direction,
        speed:
          Number(
            speed.toFixed(4)
          ),
        dx:
          Number(
            dx.toFixed(5)
          ),
        dy:
          Number(
            dy.toFixed(5)
          ),
        dz:
          Number(
            dz.toFixed(5)
          ),
        distance:
          Number(
            distance.toFixed(5)
          )
      };
    this.previousMotions[
      side
    ] = motion;
    return motion;
  }
  private getMovementDirection(
    dx: number,
    dy: number,
    dz: number
  ): string {
    const visualDx =
      -dx;
    const absoluteX =
      Math.abs(
        visualDx
      );
    const absoluteY =
      Math.abs(
        dy
      );
    const absoluteZ =
      Math.abs(
        dz
      );
    const maximum =
      Math.max(
        absoluteX,
        absoluteY,
        absoluteZ
      );
    if (
      maximum ===
      absoluteZ &&
      absoluteZ >
      absoluteX * 1.2 &&
      absoluteZ >
      absoluteY * 1.2
    ) {
      return dz < 0
        ? 'Hacia la cámara'
        : 'Alejándose de la cámara';
    }
    if (
      absoluteX >=
      absoluteY
    ) {
      return visualDx > 0
        ? 'Derecha'
        : 'Izquierda';
    }
    return dy > 0
      ? 'Abajo'
      : 'Arriba';
  }
  private addTrajectoryPoint(
    side: KnownHandSide,
    center: SpatialPoint,
    timestamp: number
  ): void {
    const point:
      MotionPoint = {
        x:
          Number(
            center.x.toFixed(4)
          ),
        y:
          Number(
            center.y.toFixed(4)
          ),
        z:
          Number(
            center.z.toFixed(4)
          ),
        timestamp
      };
    if (
      side ===
      'Izquierda'
    ) {
      const trajectory =
        [
          ...this.leftTrajectory(),
          point
        ];
      if (
        trajectory.length >
        this.trajectoryLimit
      ) {
        trajectory.shift();
      }
      this.leftTrajectory.set(
        trajectory
      );
      return;
    }
    const trajectory =
      [
        ...this.rightTrajectory(),
        point
      ];
    if (
      trajectory.length >
      this.trajectoryLimit
    ) {
      trajectory.shift();
    }
    this.rightTrajectory.set(
      trajectory
    );
  }
  private updateCombinedFeatureVector():
    void {
    const leftMotion =
      this.leftHandMotion();
    const rightMotion =
      this.rightHandMotion();
    const vector =
      [
        ...this.combinedNormalizedVector(),
        leftMotion.dx,
        leftMotion.dy,
        leftMotion.dz,
        leftMotion.speed,
        rightMotion.dx,
        rightMotion.dy,
        rightMotion.dz,
        rightMotion.speed,
        this.interHandDistance()
      ];
    this.combinedFeatureVector.set(
      vector
    );
  }
  private scheduleNextDetection():
    void {
    if (
      !this.detectionRunning
    ) {
      return;
    }
    this.animationFrameId =
      requestAnimationFrame(
        this.detectHands
      );
  }
  private normalizeHand(
    landmarks: {
      x: number;
      y: number;
      z: number;
    }[]
  ): HandPoint[] {
    if (
      landmarks.length === 0
    ) {
      return [];
    }
    const wrist =
      landmarks[0];
    const centered =
      landmarks.map(
        (point, index) => ({
          id: index,
          x:
            point.x -
            wrist.x,
          y:
            point.y -
            wrist.y,
          z:
            point.z -
            wrist.z
        })
      );
    let maxDistance =
      0;
    for (
      const point
      of centered
    ) {
      const distance =
        Math.sqrt(
          point.x *
          point.x +
          point.y *
          point.y +
          point.z *
          point.z
        );
      if (
        distance >
        maxDistance
      ) {
        maxDistance =
          distance;
      }
    }
    if (
      maxDistance <
      0.000001
    ) {
      maxDistance =
        1;
    }
    return centered.map(
      point => ({
        id:
          point.id,
        x:
          Number(
            (
              point.x /
              maxDistance
            ).toFixed(4)
          ),
        y:
          Number(
            (
              point.y /
              maxDistance
            ).toFixed(4)
          ),
        z:
          Number(
            (
              point.z /
              maxDistance
            ).toFixed(4)
          )
      })
    );
  }
  private calculateAngle(
    a: HandPoint,
    b: HandPoint,
    c: HandPoint
  ): number {
    const vectorBA = {
      x:
        a.x -
        b.x,
      y:
        a.y -
        b.y,
      z:
        a.z -
        b.z
    };
    const vectorBC = {
      x:
        c.x -
        b.x,
      y:
        c.y -
        b.y,
      z:
        c.z -
        b.z
    };
    const dotProduct =
      vectorBA.x *
      vectorBC.x +
      vectorBA.y *
      vectorBC.y +
      vectorBA.z *
      vectorBC.z;
    const magnitudeBA =
      Math.sqrt(
        vectorBA.x ** 2 +
        vectorBA.y ** 2 +
        vectorBA.z ** 2
      );
    const magnitudeBC =
      Math.sqrt(
        vectorBC.x ** 2 +
        vectorBC.y ** 2 +
        vectorBC.z ** 2
      );
    if (
      magnitudeBA === 0 ||
      magnitudeBC === 0
    ) {
      return 0;
    }
    let cosine =
      dotProduct /
      (
        magnitudeBA *
        magnitudeBC
      );
    cosine =
      Math.max(
        -1,
        Math.min(
          1,
          cosine
        )
      );
    return (
      Math.acos(
        cosine
      ) *
      180 /
      Math.PI
    );
  }
  private getFingerAnalysis(
    points: HandPoint[]
  ): {
    states: FingerStates;
    count: number;
    shape: string;
  } {
    if (
      points.length !== 21
    ) {
      return {
        states:
          this.createEmptyFingerStates(),
        count: 0,
        shape: 'Sin analizar'
      };
    }
    const thumbAngle =
      this.calculateAngle(
        points[2],
        points[3],
        points[4]
      );
    const indexAngle =
      this.calculateAngle(
        points[5],
        points[6],
        points[8]
      );
    const middleAngle =
      this.calculateAngle(
        points[9],
        points[10],
        points[12]
      );
    const ringAngle =
      this.calculateAngle(
        points[13],
        points[14],
        points[16]
      );
    const pinkyAngle =
      this.calculateAngle(
        points[17],
        points[18],
        points[20]
      );
    const states:
      FingerStates = {
        thumb:
          thumbAngle >
          150,
        index:
          indexAngle >
          155,
        middle:
          middleAngle >
          155,
        ring:
          ringAngle >
          155,
        pinky:
          pinkyAngle >
          150
      };
    const count =
      Object.values(
        states
      ).filter(
        value => value
      ).length;
    const shape =
      this.getHandShape(
        states,
        count
      );
    return {
      states,
      count,
      shape
    };
  }
  private getHandShape(
    fingers: FingerStates,
    count: number
  ): string {
    if (
      count === 5
    ) {
      return 'Mano abierta';
    }
    if (
      count === 0
    ) {
      return 'Puño';
    }
    if (
      fingers.index &&
      !fingers.middle &&
      !fingers.ring &&
      !fingers.pinky
    ) {
      return 'Índice levantado';
    }
    if (
      fingers.index &&
      fingers.middle &&
      !fingers.ring &&
      !fingers.pinky
    ) {
      return 'Dos dedos';
    }
    if (
      fingers.thumb &&
      !fingers.index &&
      !fingers.middle &&
      !fingers.ring &&
      !fingers.pinky
    ) {
      return 'Pulgar extendido';
    }
    if (
      fingers.thumb &&
      fingers.index &&
      !fingers.middle &&
      !fingers.ring &&
      !fingers.pinky
    ) {
      return 'Pulgar e índice extendidos';
    }
    if (
      !fingers.thumb &&
      fingers.index &&
      fingers.middle &&
      fingers.ring &&
      !fingers.pinky
    ) {
      return 'Tres dedos';
    }
    if (
      !fingers.thumb &&
      fingers.index &&
      fingers.middle &&
      fingers.ring &&
      fingers.pinky
    ) {
      return 'Cuatro dedos';
    }
    return 'Configuración no identificada';
  }
  private resetPrimaryHand():
    void {
    this.handSide.set(
      '---'
    );
    this.handConfidence.set(
      0
    );
    this.handCoordinates.set(
      []
    );
    this.normalizedCoordinates.set(
      []
    );
    this.fingerStates.set(
      this.createEmptyFingerStates()
    );
    this.extendedFingerCount.set(
      0
    );
    this.handShape.set(
      'Sin analizar'
    );
  }
  private resetMotionTracking():
    void {
    this.previousCenters = {
      Izquierda: null,
      Derecha: null
    };
    this.previousMotions = {
      Izquierda:
        this.createEmptyMotion(),
      Derecha:
        this.createEmptyMotion()
    };
    this.leftHandMotion.set(
      this.createEmptyMotion()
    );
    this.rightHandMotion.set(
      this.createEmptyMotion()
    );
    this.leftTrajectory.set(
      []
    );
    this.rightTrajectory.set(
      []
    );
    this.combinedFeatureVector.set(
      []
    );
  }
  private resetHands():
    void {
    this.leftHand.set(
      this.createEmptyHand(
        'Izquierda'
      )
    );
    this.rightHand.set(
      this.createEmptyHand(
        'Derecha'
      )
    );
    this.detectedHandAnalyses.set(
      []
    );
    this.combinedNormalizedVector.set(
      []
    );
    this.interHandDistance.set(
      0
    );
    this.resetPrimaryHand();
    this.resetMotionTracking();
  }
  stopCamera():
    void {
    this.detectionRunning =
      false;
    if (
      this.animationFrameId !==
      null
    ) {
      cancelAnimationFrame(
        this.animationFrameId
      );
      this.animationFrameId =
        null;
    }
    if (
      this.stream
    ) {
      this.stream
        .getTracks()
        .forEach(
          track => {
            track.stop();
          }
        );
      this.stream =
        null;
    }
    const video =
      this.videoElement
        ?.nativeElement;
    if (
      video
    ) {
      video.pause();
      video.srcObject =
        null;
    }
    const canvas =
      this.canvasElement
        ?.nativeElement;
    if (
      canvas
    ) {
      const context =
        canvas.getContext(
          '2d'
        );
      context?.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );
    }
    this.lastVideoTime =
      -1;
    this.lastDetectionTime =
      0;
    this.cameraStatus.set(
      'Cámara desactivada'
    );
    this.handStatus.set(
      'Sin manos detectadas'
    );
    this.detectedHands.set(
      0
    );
    this.resetHands();
  }
  ngOnDestroy():
    void {
    this.stopCamera();
    if (
      this.handLandmarker
    ) {
      this.handLandmarker.close();
      this.handLandmarker =
        null;
    }
  }
}