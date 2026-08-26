import {
  getProductEventDefinition,
  validateProductEvent,
  type ValidatedProductEvent
} from '../../domain/analytics/productEvent';
import {
  getAnonymousAssessmentState,
  PersistenceError
} from './anonymousAssessmentRepository';
import type { PcsDatabase } from './database';
import { productEvents } from './analyticsSchema';

export class FirstPartyAnalyticsError extends Error {
  constructor(
    public readonly code:
      | 'UNKNOWN_EVENT'
      | 'SESSION_REQUIRED'
      | 'SESSION_INVALID'
      | 'SESSION_MODEL_MISMATCH',
    message: string
  ) {
    super(message);
    this.name = 'FirstPartyAnalyticsError';
  }
}

async function resolveSession(
  db: PcsDatabase,
  privateToken: string | null | undefined,
  scope: 'none' | 'optional' | 'required'
) {
  if (scope === 'none') return null;
  if (!privateToken) {
    if (scope === 'required') {
      throw new FirstPartyAnalyticsError('SESSION_REQUIRED', 'This analytics event requires an assessment session');
    }
    return null;
  }

  try {
    return await getAnonymousAssessmentState(db, privateToken);
  } catch (error) {
    if (scope === 'required') {
      throw new FirstPartyAnalyticsError('SESSION_INVALID', 'Required assessment session is unavailable');
    }
    if (error instanceof PersistenceError) return null;
    throw error;
  }
}

export async function recordFirstPartyProductEvent(
  db: PcsDatabase,
  input: {
    name: string;
    source: 'client' | 'server';
    properties?: unknown;
    privateToken?: string | null;
  }
): Promise<{
  eventId: string;
  event: ValidatedProductEvent;
  sessionId: string | null;
  createdAt: Date;
}> {
  const definition = getProductEventDefinition(input.name);
  if (!definition) {
    throw new FirstPartyAnalyticsError('UNKNOWN_EVENT', `Unknown product event ${input.name}`);
  }

  const state = await resolveSession(db, input.privateToken, definition.session_scope);
  const properties = {
    ...(typeof input.properties === 'object' && input.properties !== null && !Array.isArray(input.properties)
      ? input.properties as Record<string, unknown>
      : {})
  };

  if (state && 'modelVersion' in definition.properties) {
    if (properties.modelVersion !== undefined && properties.modelVersion !== state.modelVersion) {
      throw new FirstPartyAnalyticsError(
        'SESSION_MODEL_MISMATCH',
        'Analytics modelVersion does not match the authenticated assessment session'
      );
    }
    properties.modelVersion = state.modelVersion;
  }

  if (state && 'locale' in definition.properties) {
    if (properties.locale !== undefined && properties.locale !== state.locale) {
      throw new FirstPartyAnalyticsError(
        'SESSION_MODEL_MISMATCH',
        'Analytics locale does not match the authenticated assessment session'
      );
    }
    properties.locale = state.locale;
  }

  const event = validateProductEvent({
    name: input.name,
    source: input.source,
    properties
  });

  const [created] = await db
    .insert(productEvents)
    .values({
      sessionId: state?.sessionId ?? null,
      eventDictionaryVersion: event.dictionaryVersion,
      eventName: event.name,
      eventSource: input.source,
      propertiesJson: event.properties
    })
    .returning({
      eventId: productEvents.eventId,
      createdAt: productEvents.createdAt
    });

  if (!created) throw new Error('Failed to persist first-party product event');

  return {
    eventId: created.eventId,
    event,
    sessionId: state?.sessionId ?? null,
    createdAt: created.createdAt
  };
}
