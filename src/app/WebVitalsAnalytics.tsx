'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { sendClientProductEvent } from './_analytics/client';

const ALLOWED_METRICS = new Set(['LCP', 'INP', 'CLS', 'TTFB']);
const ALLOWED_BUCKETS = new Set(['good', 'needs-improvement', 'poor']);

type WebVitalsCallback = Parameters<typeof useReportWebVitals>[0];

const reportWebVitals: WebVitalsCallback = (metric) => {
  if (!ALLOWED_METRICS.has(metric.name)) return;

  const rating =
    'rating' in metric && typeof metric.rating === 'string'
      ? metric.rating
      : null;
  if (!rating || !ALLOWED_BUCKETS.has(rating)) return;

  void sendClientProductEvent('performance_measure', {
    metric: metric.name,
    bucket: rating
  });
};

export default function WebVitalsAnalytics() {
  useReportWebVitals(reportWebVitals);
  return null;
}
