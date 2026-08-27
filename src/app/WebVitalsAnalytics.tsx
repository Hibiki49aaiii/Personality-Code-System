'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { sanitizeWebVitalMetric } from '../domain/analytics/webVitals';
import { sendClientProductEvent } from './_analytics/client';

type WebVitalsCallback = Parameters<typeof useReportWebVitals>[0];

const reportWebVitals: WebVitalsCallback = (metric) => {
  const sanitized = sanitizeWebVitalMetric(metric);
  if (!sanitized) return;
  void sendClientProductEvent('performance_measure', sanitized);
};

export default function WebVitalsAnalytics() {
  useReportWebVitals(reportWebVitals);
  return null;
}
