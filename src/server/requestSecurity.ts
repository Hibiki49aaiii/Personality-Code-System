import type { NextRequest } from 'next/server';
import { getSiteOrigin } from './siteOrigin';

export class CrossSiteMutationError extends Error {
  constructor() {
    super('Cross-site mutation request rejected');
    this.name = 'CrossSiteMutationError';
  }
}

export function assertTrustedMutationRequest(request: NextRequest): void {
  const expectedOrigin = getSiteOrigin().origin;
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');

  if (origin) {
    let parsedOrigin: string;
    try {
      parsedOrigin = new URL(origin).origin;
    } catch {
      throw new CrossSiteMutationError();
    }
    if (parsedOrigin !== expectedOrigin) throw new CrossSiteMutationError();
  }

  if (fetchSite === 'cross-site') throw new CrossSiteMutationError();
}
