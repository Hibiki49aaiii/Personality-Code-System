export type AllowedWebVitalMetric = 'LCP' | 'INP' | 'CLS' | 'TTFB';
export type WebVitalRatingBucket = 'good' | 'needs-improvement' | 'poor';

const ALLOWED_METRICS = new Set<AllowedWebVitalMetric>(['LCP', 'INP', 'CLS', 'TTFB']);
const ALLOWED_BUCKETS = new Set<WebVitalRatingBucket>(['good', 'needs-improvement', 'poor']);

export function sanitizeWebVitalMetric(input: {
  name?: unknown;
  rating?: unknown;
}): { metric: AllowedWebVitalMetric; bucket: WebVitalRatingBucket } | null {
  if (typeof input.name !== 'string' || !ALLOWED_METRICS.has(input.name as AllowedWebVitalMetric)) {
    return null;
  }
  if (typeof input.rating !== 'string' || !ALLOWED_BUCKETS.has(input.rating as WebVitalRatingBucket)) {
    return null;
  }

  return {
    metric: input.name as AllowedWebVitalMetric,
    bucket: input.rating as WebVitalRatingBucket
  };
}
