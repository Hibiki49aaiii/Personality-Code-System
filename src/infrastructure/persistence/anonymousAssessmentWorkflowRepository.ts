import { and, asc, eq } from 'drizzle-orm';
import type { PcsDatabase } from './database';
import { hashAnonymousSessionToken } from './sessionToken';
import {
  anonymousSessions,
  assessmentAnswers,
  assessmentModelItems
} from './schema';
import {
  PersistenceError,
  saveAnonymousAssessmentAnswer
} from './anonymousAssessmentRepository';

export interface AnonymousAssessmentSessionState {
  sessionId: string;
  modelVersion: string;
  locale: string;
  status: string;
  expiresAt: Date;
  completedAt: Date | null;
}

export interface AnonymousAssessmentStoredAnswer {
  itemId: string;
  value: number;
  updatedAt: Date;
}

export async function getAnonymousAssessmentSessionState(
  db: PcsDatabase,
  token: string
): Promise<AnonymousAssessmentSessionState> {
  const tokenHash = hashAnonymousSessionToken(token);
  const [session] = await db
    .select({
      sessionId: anonymousSessions.sessionId,
      modelVersion: anonymousSessions.modelVersion,
      locale: anonymousSessions.locale,
      status: anonymousSessions.status,
      expiresAt: anonymousSessions.expiresAt,
      completedAt: anonymousSessions.completedAt
    })
    .from(anonymousSessions)
    .where(eq(anonymousSessions.accessTokenHash, tokenHash))
    .limit(1);

  if (!session) {
    throw new PersistenceError('SESSION_NOT_FOUND', 'Anonymous assessment session was not found');
  }

  if (session.status === 'in_progress' && session.expiresAt.getTime() <= Date.now()) {
    await db
      .update(anonymousSessions)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(
        and(
          eq(anonymousSessions.sessionId, session.sessionId),
          eq(anonymousSessions.status, 'in_progress')
        )
      );
    throw new PersistenceError('SESSION_EXPIRED', 'Anonymous assessment session has expired');
  }

  return session;
}

export async function getAnonymousAssessmentStoredAnswers(
  db: PcsDatabase,
  token: string
): Promise<AnonymousAssessmentStoredAnswer[]> {
  const session = await getAnonymousAssessmentSessionState(db, token);
  return db
    .select({
      itemId: assessmentAnswers.itemId,
      value: assessmentAnswers.value,
      updatedAt: assessmentAnswers.updatedAt
    })
    .from(assessmentAnswers)
    .where(eq(assessmentAnswers.sessionId, session.sessionId))
    .orderBy(asc(assessmentAnswers.itemId));
}

export async function saveAnonymousAssessmentAnswerForSessionModel(
  db: PcsDatabase,
  input: { token: string; itemId: string; value: number }
): Promise<void> {
  const session = await getAnonymousAssessmentSessionState(db, input.token);
  if (session.status !== 'in_progress') {
    throw new PersistenceError('SESSION_NOT_WRITABLE', 'Anonymous assessment session is no longer writable');
  }

  const [mapping] = await db
    .select({
      itemRevision: assessmentModelItems.itemRevision,
      locale: assessmentModelItems.locale
    })
    .from(assessmentModelItems)
    .where(
      and(
        eq(assessmentModelItems.modelVersion, session.modelVersion),
        eq(assessmentModelItems.itemId, input.itemId)
      )
    )
    .limit(1);

  if (!mapping || mapping.locale !== session.locale) {
    throw new PersistenceError(
      'INVALID_ANSWER',
      'Answer item is not part of the versioned assessment model for this session'
    );
  }

  await saveAnonymousAssessmentAnswer(db, {
    token: input.token,
    itemId: input.itemId,
    itemRevision: mapping.itemRevision,
    locale: mapping.locale,
    value: input.value
  });
}
