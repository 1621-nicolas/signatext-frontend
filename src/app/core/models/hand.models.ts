export interface HandPoint {
  id: number;
  x: number;
  y: number;
  z: number;
}

export interface SpatialPoint {
  x: number;
  y: number;
  z: number;
}

export interface FingerStates {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

export interface HandAnalysis {
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

export interface MotionPoint {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface HandMotion {
  moving: boolean;
  direction: string;
  speed: number;
  dx: number;
  dy: number;
  dz: number;
  distance: number;
}

export type KnownHandSide = 'Izquierda' | 'Derecha';
