/** Resumen de una serie de tiempos en milisegundos, con los mismos percentiles que el benchmark nativo. */
export type LatencySummary = { mean: number; p50: number; p90: number; p95: number; min: number; max: number };

/** Percentil con interpolación lineal entre muestras ordenadas (el método por defecto de NumPy). */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const position = (sorted.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function summarize(values: number[]): LatencySummary {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    p50: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
    p95: percentile(sorted, 0.95),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}
