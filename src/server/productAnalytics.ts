import type { PcsDatabase } from '../infrastructure/persistence/database';
import {
  recordFirstPartyProductEvent,
  type FirstPartyAnalyticsError
} from '../infrastructure/persistence/analyticsRepository';

export async function recordServerProductEventBestEffort(
  db: PcsDatabase,
  input: {
    name: string;
    privateToken?: string | null;
    properties?: unknown;
  }
): Promise<void> {
  try {
    await recordFirstPartyProductEvent(db, {
      name: input.name,
      source: 'server',
      privateToken: input.privateToken,
      properties: input.properties
    });
  } catch (error) {
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as FirstPartyAnalyticsError).code === 'string'
        ? (error as FirstPartyAnalyticsError).code
        : 'UNCLASSIFIED';
    console.warn('Non-blocking product analytics event failed', {
      event: input.name,
      code
    });
  }
}
