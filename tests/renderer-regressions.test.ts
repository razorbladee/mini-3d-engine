import { describe, expect, it } from 'vitest';
import { BasicMaterial, PerformanceMetrics, SpotLight, HemisphereLight } from '../src';
describe('renderer and production regressions', () => {
  it('keeps transparent material state explicit', () => {
    const material = new BasicMaterial({ opacity: 0.4 });
    expect(material.transparent).toBe(true);
    expect(material.opacity).toBe(0.4);
  });
  it('exposes the gallery light types', () => {
    expect(new SpotLight().direction.y).toBe(-1);
    expect(new HemisphereLight().groundColor).toBe('#777777');
  });
  it('reports frame metrics', () => {
    const metrics = new PerformanceMetrics().update(0.5);
    expect(metrics.frames).toBe(1);
    expect(metrics.fps).toBe(2);
  });
});
