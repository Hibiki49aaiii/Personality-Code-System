'use client';

import { useEffect } from 'react';
import {
  sendClientProductEvent,
  viewportCategory
} from './_analytics/client';

export default function LandingAnalytics() {
  useEffect(() => {
    void sendClientProductEvent('landing_viewed', {
      viewportCategory: viewportCategory(),
      locale: document.documentElement.lang || 'ja'
    });
  }, []);

  return null;
}
