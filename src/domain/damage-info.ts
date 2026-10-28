import type { IncidentType } from './incident';

export type DamageInfo = {
  /** Qué es, en una frase. */
  summary: string;
  /** Cómo reconocerlo en la foto del reporte. */
  howToSpot: string[];
  /** Por qué aparece y qué pasa si no se atiende. */
  cause: string;
};

/** Significado de cada clase de LMD-YOLO (RDD2022: D00, D10, D20, D40), para que el operador sepa a qué daño se refiere. */
export const DAMAGE_INFO: Record<IncidentType, DamageInfo> = {
  D00: {
    summary: 'Fisura que corre a lo largo de la pista, en el mismo sentido en que avanzan los vehículos.',
    howToSpot: [
      'Línea delgada, casi recta o algo ondulada, paralela a las líneas del carril.',
      'Suele aparecer por donde pasan las llantas o en la unión entre dos carriles.',
    ],
    cause: 'Se forma por el paso repetido de vehículos o por una mala unión al construir la pista. Si no se sella, entra agua y se abre más.',
  },
  D10: {
    summary: 'Fisura que cruza la pista de lado a lado, perpendicular al sentido en que avanzan los vehículos.',
    howToSpot: [
      'Línea que atraviesa el carril de un borde al otro, como un corte.',
      'Muchas veces aparecen varias, separadas por algunos metros.',
    ],
    cause: 'Se forma porque el asfalto se encoge y se dilata con los cambios de temperatura, o por juntas de la capa inferior. Si no se sella, deja pasar agua a la base.',
  },
  D20: {
    summary: 'Zona con muchas grietas unidas entre sí que forman pedacitos, como la piel de un cocodrilo.',
    howToSpot: [
      'Red de grietas que se cruzan y dejan polígonos pequeños, de pocos centímetros.',
      'Ocupa un área (no es una sola línea) y suele estar en la huella de las llantas.',
    ],
    cause: 'Indica que el pavimento ya está cansado o que la base de abajo es débil. Es el paso previo a un bache: los pedazos se sueltan con el tráfico.',
  },
  D40: {
    summary: 'Hueco en la pista donde el asfalto se desprendió y se ve la capa de abajo.',
    howToSpot: [
      'Hoyo con bordes marcados y profundidad; a veces con agua o piedras sueltas dentro.',
      'Forma redondeada o irregular, más oscura que el asfalto que lo rodea.',
    ],
    cause: 'Suele empezar como piel de cocodrilo o grietas sin reparar. Es el daño más peligroso para vehículos, motos y peatones.',
  },
};
