import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeWebVitalMetric } from '../../src/domain/analytics/webVitals';

test('Web Vitals sanitizer emits only metric name and rating bucket', () => {
  const sanitized = sanitizeWebVitalMetric({
    name: 'LCP',
    rating: 'good',
    value: 1234.567,
    delta: 222,
    id: 'v4-opaque-id',
    navigationType: 'navigate'
  } as {
    name: string;
    rating: string;
    value: number;
    delta: number;
    id: string;
    navigationType: string;
  });

  assert.deepEqual(sanitized, {
    metric: 'LCP',
    bucket: 'good'
  });
  assert.equal('value' in (sanitized ?? {}), false);
  assert.equal('delta' in (sanitized ?? {}), false);
  assert.equal('id' in (sanitized ?? {}), false);
});

test('Web Vitals sanitizer rejects unsupported metrics and ratings', () => {
  assert.equal(sanitizeWebVitalMetric({ name: 'FCP', rating: 'good' }), null);
  assert.equal(sanitizeWebVitalMetric({ name: 'LCP', rating: 'unknown' }), null);
  assert.equal(sanitizeWebVitalMetric({ name: 'LCP' }), null);
});
