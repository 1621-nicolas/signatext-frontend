export interface DatasetFrame {
  timestamp: number;
  leftHand: number[] | null;
  rightHand: number[] | null;
  leftHandedness: number;
  rightHandedness: number;
}

export interface DatasetSample {
  id: string;
  label: string;
  participantId: string;
  dominantHand: 'Derecha' | 'Izquierda';
  sampleNumber: number;
  frames: DatasetFrame[];
  totalFrames: number;
  durationMs: number;
  capturedAt: string;
  metadata: {
    resolution: { width: number; height: number };
    userAgent: string;
  };
}

export interface DatasetCollection {
  projectName: string;
  version: string;
  exportedAt: string;
  samples: DatasetSample[];
}

export interface LspSignDefinition {
  label: string;
  category: string;
  description: string;
  isStatic: boolean;
  requiresTwoHands: boolean;
  referenceNotes: string;
}

export type CapturePhase = 'idle' | 'countdown' | 'capturing' | 'reviewing';

export interface CaptureSettings {
  durationMs: number;
  countdownSeconds: number;
  framesPerSecond: number;
}

export interface DatasetStatistics {
  totalSamples: number;
  totalFrames: number;
  uniqueLabels: number;
  uniqueParticipants: number;
  byLabel: Record<string, number>;
  byParticipant: Record<string, number>;
  byCategory: Record<string, number>;
}

export const LSP_CATALOG: LspSignDefinition[] = [
  // Alfabeto
  { label: 'A', category: 'Alfabeto', description: 'Letra A', isStatic: true, requiresTwoHands: false, referenceNotes: 'Puño cerrado con pulgar extendido al costado' },
  { label: 'B', category: 'Alfabeto', description: 'Letra B', isStatic: true, requiresTwoHands: false, referenceNotes: 'Palma abierta, dedos juntos, pulgar flexionado sobre la palma' },
  { label: 'C', category: 'Alfabeto', description: 'Letra C', isStatic: true, requiresTwoHands: false, referenceNotes: 'Mano formando una C' },
  { label: 'D', category: 'Alfabeto', description: 'Letra D', isStatic: true, requiresTwoHands: false, referenceNotes: 'Dedo índice extendido, pulgar tocando el resto de los dedos formando un círculo' },
  { label: 'E', category: 'Alfabeto', description: 'Letra E', isStatic: true, requiresTwoHands: false, referenceNotes: 'Dedos flexionados tocando el borde de la palma, pulgar sobre ellos' },
  { label: 'F', category: 'Alfabeto', description: 'Letra F', isStatic: true, requiresTwoHands: false, referenceNotes: 'Pulgar e índice formando un círculo, otros tres dedos extendidos' },
  { label: 'G', category: 'Alfabeto', description: 'Letra G', isStatic: true, requiresTwoHands: false, referenceNotes: 'Índice y pulgar extendidos paralelamente, apuntando de lado' },
  { label: 'H', category: 'Alfabeto', description: 'Letra H', isStatic: true, requiresTwoHands: false, referenceNotes: 'Índice y medio extendidos paralelamente, pulgar flexionado, apuntando de lado' },
  { label: 'I', category: 'Alfabeto', description: 'Letra I', isStatic: true, requiresTwoHands: false, referenceNotes: 'Meñique extendido, los demás cerrados' },
  { label: 'J', category: 'Alfabeto', description: 'Letra J', isStatic: false, requiresTwoHands: false, referenceNotes: 'Meñique extendido trazando una J en el aire' },
  { label: 'K', category: 'Alfabeto', description: 'Letra K', isStatic: true, requiresTwoHands: false, referenceNotes: 'Índice y medio extendidos, pulgar apoyado entre ellos apuntando hacia arriba' },
  { label: 'L', category: 'Alfabeto', description: 'Letra L', isStatic: true, requiresTwoHands: false, referenceNotes: 'Índice y pulgar extendidos formando una L' },
  { label: 'M', category: 'Alfabeto', description: 'Letra M', isStatic: true, requiresTwoHands: false, referenceNotes: 'Tres dedos (índice, medio, anular) sobre el pulgar, apuntando hacia abajo' },
  { label: 'N', category: 'Alfabeto', description: 'Letra N', isStatic: true, requiresTwoHands: false, referenceNotes: 'Dos dedos (índice y medio) sobre el pulgar, apuntando hacia abajo' },
  { label: 'O', category: 'Alfabeto', description: 'Letra O', isStatic: true, requiresTwoHands: false, referenceNotes: 'Todos los dedos se curvan tocando el pulgar formando una O' },
  { label: 'P', category: 'Alfabeto', description: 'Letra P', isStatic: true, requiresTwoHands: false, referenceNotes: 'Similar a la K pero apuntando hacia abajo' },
  { label: 'Q', category: 'Alfabeto', description: 'Letra Q', isStatic: true, requiresTwoHands: false, referenceNotes: 'Similar a la G pero apuntando hacia abajo' },
  { label: 'R', category: 'Alfabeto', description: 'Letra R', isStatic: true, requiresTwoHands: false, referenceNotes: 'Dedos índice y medio cruzados' },
  { label: 'S', category: 'Alfabeto', description: 'Letra S', isStatic: true, requiresTwoHands: false, referenceNotes: 'Puño cerrado con el pulgar cruzado al frente sobre los dedos' },
  { label: 'T', category: 'Alfabeto', description: 'Letra T', isStatic: true, requiresTwoHands: false, referenceNotes: 'Puño con el pulgar entre el índice y el medio' },
  { label: 'U', category: 'Alfabeto', description: 'Letra U', isStatic: true, requiresTwoHands: false, referenceNotes: 'Índice y medio extendidos y juntos hacia arriba' },
  { label: 'V', category: 'Alfabeto', description: 'Letra V', isStatic: true, requiresTwoHands: false, referenceNotes: 'Índice y medio extendidos separados formando una V' },
  { label: 'W', category: 'Alfabeto', description: 'Letra W', isStatic: true, requiresTwoHands: false, referenceNotes: 'Índice, medio y anular extendidos y separados' },
  { label: 'X', category: 'Alfabeto', description: 'Letra X', isStatic: true, requiresTwoHands: false, referenceNotes: 'Dedo índice como un gancho, puño cerrado' },
  { label: 'Y', category: 'Alfabeto', description: 'Letra Y', isStatic: true, requiresTwoHands: false, referenceNotes: 'Pulgar y meñique extendidos, los otros tres flexionados' },
  { label: 'Z', category: 'Alfabeto', description: 'Letra Z', isStatic: false, requiresTwoHands: false, referenceNotes: 'Índice trazando una Z en el aire' },
  // Números
  { label: '0', category: 'Números', description: 'Número Cero', isStatic: true, requiresTwoHands: false, referenceNotes: 'Mano formando una O' },
  { label: '1', category: 'Números', description: 'Número Uno', isStatic: true, requiresTwoHands: false, referenceNotes: 'Dedo índice extendido' },
  { label: '2', category: 'Números', description: 'Número Dos', isStatic: true, requiresTwoHands: false, referenceNotes: 'Índice y medio extendidos' },
  { label: '3', category: 'Números', description: 'Número Tres', isStatic: true, requiresTwoHands: false, referenceNotes: 'Pulgar, índice y medio extendidos' },
  { label: '4', category: 'Números', description: 'Número Cuatro', isStatic: true, requiresTwoHands: false, referenceNotes: 'Cuatro dedos extendidos, pulgar flexionado' },
  { label: '5', category: 'Números', description: 'Número Cinco', isStatic: true, requiresTwoHands: false, referenceNotes: 'Todos los dedos extendidos y separados' },
  { label: '6', category: 'Números', description: 'Número Seis', isStatic: true, requiresTwoHands: false, referenceNotes: 'Pulgar tocando el meñique' },
  { label: '7', category: 'Números', description: 'Número Siete', isStatic: true, requiresTwoHands: false, referenceNotes: 'Pulgar tocando el anular' },
  { label: '8', category: 'Números', description: 'Número Ocho', isStatic: true, requiresTwoHands: false, referenceNotes: 'Pulgar tocando el medio' },
  { label: '9', category: 'Números', description: 'Número Nueve', isStatic: true, requiresTwoHands: false, referenceNotes: 'Pulgar tocando el índice' },
  // Saludos
  { label: 'HOLA', category: 'Saludos', description: 'Saludo casual', isStatic: false, requiresTwoHands: false, referenceNotes: 'Mano en la frente, se aleja ligeramente como saludo militar' },
  { label: 'BUENOS_DIAS', category: 'Saludos', description: 'Buenos días', isStatic: false, requiresTwoHands: true, referenceNotes: 'Mano hábil sale de la barbilla hacia abajo y adelante' },
  { label: 'BUENAS_TARDES', category: 'Saludos', description: 'Buenas tardes', isStatic: false, requiresTwoHands: true, referenceNotes: 'Mano golpea ligeramente la otra mano horizontal' },
  { label: 'BUENAS_NOCHES', category: 'Saludos', description: 'Buenas noches', isStatic: false, requiresTwoHands: true, referenceNotes: 'Ambas manos se cruzan hacia abajo frente al cuerpo' },
  { label: 'ADIOS', category: 'Saludos', description: 'Despedida', isStatic: false, requiresTwoHands: false, referenceNotes: 'Mano abierta moviéndose de lado a lado' },
  { label: 'BIENVENIDO', category: 'Saludos', description: 'Dar la bienvenida', isStatic: false, requiresTwoHands: true, referenceNotes: 'Manos traen el movimiento hacia el cuerpo' },
  // Básico
  { label: 'SI', category: 'Básico', description: 'Afirmación', isStatic: false, requiresTwoHands: false, referenceNotes: 'Puño con la letra S moviéndose arriba y abajo' },
  { label: 'NO', category: 'Básico', description: 'Negación', isStatic: false, requiresTwoHands: false, referenceNotes: 'Índice, medio y pulgar se juntan en pinza un par de veces' },
  { label: 'GRACIAS', category: 'Básico', description: 'Agradecimiento', isStatic: false, requiresTwoHands: false, referenceNotes: 'Mano abierta se aleja de la barbilla hacia adelante' },
  { label: 'POR_FAVOR', category: 'Básico', description: 'Petición', isStatic: false, requiresTwoHands: false, referenceNotes: 'Mano plana hace un círculo sobre el pecho' },
  { label: 'PERDON', category: 'Básico', description: 'Disculpa', isStatic: false, requiresTwoHands: false, referenceNotes: 'Mano en A hace círculo sobre el pecho' },
  { label: 'AYUDA', category: 'Básico', description: 'Solicitar o dar ayuda', isStatic: false, requiresTwoHands: true, referenceNotes: 'Una mano apoya el puño de la otra hacia arriba' },
  { label: 'NECESITAR', category: 'Básico', description: 'Necesidad', isStatic: false, requiresTwoHands: false, referenceNotes: 'Mano en forma de gancho baja un par de veces' },
  { label: 'QUERER', category: 'Básico', description: 'Deseo', isStatic: false, requiresTwoHands: true, referenceNotes: 'Manos abiertas atraen algo hacia el pecho, dedos se curvan un poco' },
  { label: 'PODER', category: 'Básico', description: 'Capacidad', isStatic: false, requiresTwoHands: true, referenceNotes: 'Ambos puños bajan firmemente' },
  // Necesidades
  { label: 'AGUA', category: 'Necesidades', description: 'Bebida', isStatic: false, requiresTwoHands: false, referenceNotes: 'Mano en W toca la barbilla o boca' },
  { label: 'COMER', category: 'Necesidades', description: 'Alimentarse', isStatic: false, requiresTwoHands: false, referenceNotes: 'Mano en pinza repetidamente hacia la boca' },
  { label: 'BAÑO', category: 'Necesidades', description: 'Servicios', isStatic: false, requiresTwoHands: false, referenceNotes: 'Mano en T agitando de lado a lado' },
  { label: 'DORMIR', category: 'Necesidades', description: 'Descansar', isStatic: false, requiresTwoHands: false, referenceNotes: 'Mano se cierra mientras pasa frente a la cara' },
  { label: 'DESCANSAR', category: 'Necesidades', description: 'Tomar un respiro', isStatic: false, requiresTwoHands: true, referenceNotes: 'Brazos cruzados sobre el pecho' },
  // Emociones
  { label: 'BIEN', category: 'Emociones', description: 'Estado positivo', isStatic: false, requiresTwoHands: false, referenceNotes: 'Mano sale de la barbilla al frente (parecido a gracias)' },
  { label: 'MAL', category: 'Emociones', description: 'Estado negativo', isStatic: false, requiresTwoHands: false, referenceNotes: 'Mano sale de la barbilla y gira palma hacia abajo' },
  { label: 'FELIZ', category: 'Emociones', description: 'Alegría', isStatic: false, requiresTwoHands: true, referenceNotes: 'Manos frotan o tocan el pecho con movimiento hacia arriba' },
  { label: 'TRISTE', category: 'Emociones', description: 'Pena', isStatic: false, requiresTwoHands: true, referenceNotes: 'Manos bajan por la cara lentamente' },
  { label: 'ENOJADO', category: 'Emociones', description: 'Molestia', isStatic: false, requiresTwoHands: false, referenceNotes: 'Mano garra cruza el rostro con expresión fuerte' },
  // Preguntas
  { label: 'QUE', category: 'Preguntas', description: 'Interrogación', isStatic: false, requiresTwoHands: false, referenceNotes: 'Dedo índice oscila de lado a lado' },
  { label: 'QUIEN', category: 'Preguntas', description: 'Identidad', isStatic: false, requiresTwoHands: false, referenceNotes: 'Pulgar en barbilla, índice se dobla' },
  { label: 'DONDE', category: 'Preguntas', description: 'Lugar', isStatic: false, requiresTwoHands: false, referenceNotes: 'Dedo índice en círculo hacia arriba' },
  { label: 'CUANDO', category: 'Preguntas', description: 'Tiempo', isStatic: false, requiresTwoHands: true, referenceNotes: 'Índice hace círculo y toca otro índice' },
  { label: 'COMO', category: 'Preguntas', description: 'Forma', isStatic: false, requiresTwoHands: true, referenceNotes: 'Manos unidas giran hacia afuera y adelante' },
  { label: 'POR_QUE', category: 'Preguntas', description: 'Razón', isStatic: false, requiresTwoHands: false, referenceNotes: 'Mano toca la frente y baja formando Y' },
  { label: 'CUANTO', category: 'Preguntas', description: 'Cantidad', isStatic: false, requiresTwoHands: true, referenceNotes: 'Manos en puño se abren moviéndose hacia arriba' },
  // Personas
  { label: 'YO', category: 'Personas', description: 'Primera persona', isStatic: true, requiresTwoHands: false, referenceNotes: 'Dedo índice señala el propio pecho' },
  { label: 'TU', category: 'Personas', description: 'Segunda persona', isStatic: true, requiresTwoHands: false, referenceNotes: 'Dedo índice señala a la otra persona' },
  { label: 'EL_ELLA', category: 'Personas', description: 'Tercera persona', isStatic: true, requiresTwoHands: false, referenceNotes: 'Dedo índice señala a un lado' },
  { label: 'NOSOTROS', category: 'Personas', description: 'Plural', isStatic: false, requiresTwoHands: false, referenceNotes: 'Dedo índice va de un lado del pecho al otro' },
  { label: 'FAMILIA', category: 'Personas', description: 'Grupo familiar', isStatic: false, requiresTwoHands: true, referenceNotes: 'Manos en F forman un círculo hacia afuera' },
  { label: 'AMIGO', category: 'Personas', description: 'Amistad', isStatic: false, requiresTwoHands: true, referenceNotes: 'Índices de ambas manos se enganchan alternadamente' },
  { label: 'PROFESOR', category: 'Personas', description: 'Docente', isStatic: false, requiresTwoHands: true, referenceNotes: 'Manos a los lados de la cabeza (enseñar) más seña de persona' },
];
