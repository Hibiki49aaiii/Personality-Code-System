'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { sendClientProductEvent } from './_analytics/client';

const ALLOWED_METRICS = new Set(['LCP', 'INP', 'CLS', 'TTFB']);
const ALLOWED_BUCKETS = new Set(['good', 'needs-improvement', 'poor']);

type WebVitalsCallback = Parameters<typeof useReportWebVitals>[0];
type WebVitalMetric = Parameters<WebVitalsCallback>[0];

export function sanitizeWebVitalMetric(
  metric: WebVitalMetric
): { metric: 'LCP' | 'INP' | 'CLS' | 'TTFB'; bucket: 'good' | 'needs-improvement' | 'poor' } | null {
  if (!ALLOWED_METRICS.has(metric.name)) return null;

  const rating =
    'rating' in metric && typeof metric.rating === 'string'
      ? metric.rating
      : null;
  if (!rating || !ALLOWED_BUCKETS.has(rating)) return null;

  return {
    metric: metric.name as 'LCP' | 'INP' | 'CLS' | 'TTFB',
    bucket: rating as 'good' | 'needs-improvement' | 'poor'
  };
}

const reportWebVitals: WebVitalsCallback = (metric) => {
  const sanitized = sanitizeWebVitalMetric(metric);
  if (!sanitized) return;
  void sendClientProductEvent('performance_measure', sanitized);
};

export default function WebVitalsAnalytics() {
  useReportWebVitals(reportWebVitals);
  return null;
}
