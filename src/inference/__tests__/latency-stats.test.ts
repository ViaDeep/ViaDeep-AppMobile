import { percentile, summarize } from '../latency-stats';

describe('latency-stats', () => {
  it('interpola los percentiles como NumPy', () => {
    const sorted = [10, 20, 30, 40, 50];
    expect(percentile(sorted, 0.5)).toBe(30);
    expect(percentile(sorted, 0.9)).toBeCloseTo(46);
    expect(percentile(sorted, 0.95)).toBeCloseTo(48);
  });

  it('resume una serie desordenada', () => {
    const summary = summarize([30, 10, 50, 20, 40]);
    expect(summary).toMatchObject({ mean: 30, p50: 30, min: 10, max: 50 });
    expect(summary.p90).toBeCloseTo(46);
    expect(summary.p95).toBeCloseTo(48);
  });
});
