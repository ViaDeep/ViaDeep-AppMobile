import type { IncidentType } from './incident';

/**
 * Dibujo de referencia de cada tipo de daño: un tramo de pista visto desde arriba (los vehículos avanzan de
 * izquierda a derecha) con el daño marcado. Coordenadas en un lienzo de 320 x 180. La plataforma web usa el mismo dibujo.
 */
export const DRAWING_SIZE = { width: 320, height: 180 };

export const ROAD = {
  shoulder: '#d9d5cc',
  asphalt: '#5b6270',
  paint: '#f3f4f6',
  crack: '#111827',
  mark: '#f59e0b',
  asphaltRect: { x: 0, y: 24, width: 320, height: 132 },
  edgeLines: ['M0 32 H320', 'M0 148 H320'],
  centerLine: 'M0 90 H320',
  arrows: ['M16 61 H44 M36 54 L44 61 L36 68', 'M16 119 H44 M36 112 L44 119 L36 126'],
};

export type Ellipse = { cx: number; cy: number; rx: number; ry: number; fill: string; stroke?: string };
export type Highlight = { kind: 'rect'; x: number; y: number; width: number; height: number } | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number };

export type DamageDrawing = { cracks: string[]; ellipses: Ellipse[]; highlight: Highlight };

export const DAMAGE_DRAWINGS: Record<IncidentType, DamageDrawing> = {
  D00: {
    cracks: ['M70 60 L92 62 L110 58 L131 63 L152 60 L170 65 L193 61 L214 66 L236 62 L258 64 L282 60', 'M152 60 L158 52'],
    ellipses: [],
    highlight: { kind: 'rect', x: 62, y: 48, width: 228, height: 26 },
  },
  D10: {
    cracks: ['M171 34 L175 46 L169 58 L176 70 L170 82 L174 96 L168 108 L175 121 L170 134 L173 146', 'M174 96 L184 100'],
    ellipses: [],
    highlight: { kind: 'rect', x: 156, y: 30, width: 32, height: 120 },
  },
  D20: {
    cracks: [
      'M104 104 L128 101 L152 106 L176 102 L200 105 L226 101 L238 108',
      'M102 122 L126 118 L150 124 L174 119 L198 123 L222 118 L240 124',
      'M106 140 L130 137 L154 141 L178 136 L202 140 L228 137',
      'M104 104 L102 122 L106 140',
      'M128 101 L126 118 L130 137',
      'M152 106 L150 124 L154 141',
      'M176 102 L174 119 L178 136',
      'M200 105 L198 123 L202 140',
      'M226 101 L222 118 L228 137',
      'M238 108 L240 124',
      'M114 103 L126 118',
      'M163 104 L150 124',
      'M188 103 L198 123',
      'M140 121 L154 141',
      'M210 120 L202 140',
      'M117 120 L130 137',
      'M186 121 L178 136',
    ],
    ellipses: [],
    highlight: { kind: 'rect', x: 94, y: 96, width: 154, height: 52 },
  },
  D40: {
    cracks: ['M121 111 L108 105', 'M199 118 L213 113', 'M150 97 L146 88'],
    ellipses: [
      { cx: 160, cy: 116, rx: 40, ry: 20, fill: '#2b2f36', stroke: '#8b8f97' },
      { cx: 162, cy: 119, rx: 30, ry: 13, fill: '#1b1e23' },
      { cx: 168, cy: 121, rx: 12, ry: 4, fill: '#475569' },
      { cx: 130, cy: 104, rx: 2.5, ry: 2.5, fill: '#9ca3af' },
      { cx: 192, cy: 106, rx: 2, ry: 2, fill: '#9ca3af' },
      { cx: 147, cy: 133, rx: 2, ry: 2, fill: '#9ca3af' },
    ],
    highlight: { kind: 'ellipse', cx: 160, cy: 116, rx: 54, ry: 31 },
  },
};
