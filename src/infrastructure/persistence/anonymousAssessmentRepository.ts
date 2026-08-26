import { and, asc, eq } from 'drizzle-orm';
import type { StructuredAssessmentResult } from '../../domain/assessment/resultEngine';
import { createResultSnapshot, type ResultSnapshotV01 } from '../../domain/assessment/resultSnapshot';
import { createAnonymousSessionCredential, hashAnonymousSessionToken } from './sessionToken';
import type { PcsDatabase } from './database';
import {
  anonymousSessions,
  assessmentAnswers,
  assessmentModelReleases,
  assessmentTraitScores,
  resultSnapshots
} from './schema';

export type PersistenceErrorCode =
  | 'MODEL_NOT_AVAILABLE'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_NOT_WRITABLE'
  | 'SESSION_EXPIRED'
  | 'INVALID_ANSWER';

export class PersistenceError extends Error {
  constructor(public readonly code: PersistenceErrorCode, message: string) {
    super(message);
    this.name = 'PersistenceError';
  }
}

export interface CreateAnonymousSessionInput {
  modelVersion: string;
  locale: string;
  expiresAt: Date;
  allowedModelStatuses?: readonly string[];
}

export interface CreatedAnonymousSession {
  sessionId: string;
  token: string;
  expiresAt: Date;
}

export interface AnonymousAssessmentState {
  sessionId: string;
  modelVersion: string;
  locale: string;
  status: 'in_progress' | 'completed' | 'expired';
  expiresAt: Date;
  completedAt: Date | null;
  answers: Array<{
    itemId: string;
    itemRevision: string;
    locale: string;
    value: number;
  }>;
}

async function findSessionByToken(db: PcsDatabase, token: string) {
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
  return session ?? null;
}

async function requireWritableSession(
  db: PcsDatabase,
  token: string
): Promise<{ sessionId: string; modelVersion: string; locale: string; expiresAt: Date }> {
  const session = await findSessionByToken(db, token);

  if (!session) {
    throw new PersistenceError('SESSION_NOT_FOUND', 'Anonymous assessment session was not found');
  }
  if (session.status !== 'in_progress') {
    throw new PersistenceError('SESSION_NOT_WRITABLE', 'Anonymous assessment session is no longer writable');
  }
  if (session.expiresAt.getTime() <= Date.now()) {
    throw new PersistenceError('SESSION_EXPIRED', 'Anonymous assessment session has expired');
  }

  return {
    sessionId: session.sessionId,
    modelVersion: session.modelVersion,
    locale: session.locale,
    expiresAt: session.expiresAt
  };
}

export async function createAnonymousAssessmentSession(
  db: PcsDatabase,
  input: CreateAnonymousSessionInput
): Promise<CreatedAnonymousSession> {
  if (!(input.expiresAt instanceof Date) || Number.isNaN(input.expiresAt.getTime()) || input.expiresAt.getTime() <= Date.now()) {
    throw new Error('expiresAt must be a valid future Date');
  }

  const allowedStatuses = input.allowedModelStatuses ?? ['beta', 'published'];
  const [model] = await db
    .select({ status: assessmentModelReleases.status, locale: assessmentModelReleases.locale })
    .from(assessmentModelReleases)
    .where(eq(assessmentModelReleases.modelVersion, input.modelVersion))
    .limit(1);

  if (!model || !allowedStatuses.includes(model.status) || model.locale !== input.locale) {
    throw new PersistenceError(
      'MODEL_NOT_AVAILABLE',
      'Requested assessment model is not available for this locale/status'
    );
  }

  const credential = createAnonymousSessionCredential();
  const [session] = await db
    .insert(anonymousSessions)
    .values({
      accessTokenHash: credential.tokenHashHex,
      modelVersion: input.modelVersion,
      locale: input.locale,
      expiresAt: input.expiresAt
    })
    .returning({ sessionId: anonymousSessions.sessionId, expiresAt: anonymousSessions.expiresAt });

  if (!session) throw new Error('Failed to create anonymous assessment session');

  return {
    sessionId: session.sessionId,
    token: credential.token,
    expiresAt: session.expiresAt
  };
}

export async function getAnonymousAssessmentState(
  db: PcsDatabase,
  token: string
): Promise<AnonymousAssessmentState> {
  const session = await findSessionByToken(db, token);
  if (!session) {
    throw new PersistenceError('SESSION_NOT_FOUND', 'Anonymous assessment session was not found');
  }
  if (session.status === 'in_progress' && session.expiresAt.getTime() <= Date.now()) {
    throw new PersistenceError('SESSION_EXPIRED', 'Anonymous assessment session has expired');
  }

  const answers = session.status === 'in_progress'
    ? await db
        .select({
          itemId: assessmentAnswers.itemId,
          itemRevision: assessmentAnswers.itemRevision,
          locale: assessmentAnswers.locale,
          value: assessmentAnswers.value
        })
        .from(assessmentAnswers)
        .where(eq(assessmentAnswers.sessionId, session.sessionId))
        .orderBy(asc(assessmentAnswers.itemId))
    : [];

  return {
    sessionId: session.sessionId,
    modelVersion: session.modelVersion,
    locale: session.locale,
    status: session.status as AnonymousAssessmentState['status'],
    expiresAt: session.expiresAt,
    completedAt: session.completedAt,
    answers
  };
}

export async function saveAnonymousAssessmentAnswer(
  db: PcsDatabase,
  input: {
    token: string;
    itemId: string;
    itemRevision: string;
    locale: string;
    value: number;
  }
): Promise<void> {
  if (!Number.isInteger(input.value) || input.value < 1 || input.value > 5) {
    throw new PersistenceError('INVALID_ANSWER', 'Answer value must be an integer from 1 through 5');
  }

  const session = await requireWritableSession(db, input.token);
  if (input.locale !== session.locale) {
    throw new PersistenceError('INVALID_ANSWER', 'Answer locale does not match session locale');
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(assessmentAnswers)
      .values({
        sessionId: session.sessionId,
        itemId: input.itemId,
        itemRevision: input.itemRevision,
        locale: input.locale,
        value: input.value,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [assessmentAnswers.sessionId, assessmentAnswers.itemId],
        set: {
          itemRevision: input.itemRevision,
          locale: input.locale,
          value: input.value,
          updatedAt: new Date()
        }
      });

    await tx
      .update(anonymousSessions)
      .set({ updatedAt: new Date() })
      .where(eq(anonymousSessions.sessionId, session.sessionId));
  });
}

export async function completeAnonymousAssessment(
  db: PcsDatabase,
  input: { token: string; result: StructuredAssessmentResult }
): Promise<{ snapshotId: string; snapshot: ResultSnapshotV01 }> {
  const session = await requireWritableSession(db, input.token);
  const snapshot = createResultSnapshot(input.result);
  const completedAt = new Date();

  return db.transaction(async (tx) => {
    for (const trait of input.result.scoring.traitScores) {
      await tx
        .insert(assessmentTraitScores)
        .values({
          sessionId: session.sessionId,
          traitId: trait.traitId,
          scoringVersion: input.result.versions.scoringVersion,
          scoreBp: trait.scoreBp
        })
        .onConflictDoUpdate({
          target: [assessmentTraitScores.sessionId, assessmentTraitScores.traitId],
          set: {
            scoringVersion: input.result.versions.scoringVersion,
            scoreBp: trait.scoreBp
          }
        });
    }

    const [persisted] = await tx
      .insert(resultSnapshots)
      .values({
        sessionId: session.sessionId,
        snapshotSchemaVersion: snapshot.snapshotSchemaVersion,
        assessmentModelVersion: snapshot.versions.assessmentModelVersion,
        itemBankVersion: snapshot.versions.itemBankVersion,
        scoringVersion: snapshot.versions.scoringVersion,
        codeSchemaVersion: snapshot.versions.codeSchemaVersion,
        interactionVersion: snapshot.versions.interactionVersion,
        contentVersion: snapshot.versions.contentVersion,
        locale: snapshot.locale,
        snapshotJson: snapshot
      })
      .returning({ snapshotId: resultSnapshots.snapshotId });

    if (!persisted) throw new Error('Failed to persist result snapshot');

    await tx
      .update(anonymousSessions)
      .set({ status: 'completed', completedAt, updatedAt: completedAt })
      .where(
        and(
          eq(anonymousSessions.sessionId, session.sessionId),
          eq(anonymousSessions.status, 'in_progress')
        )
      );

    return { snapshotId: persisted.snapshotId, snapshot };
  });
}

export async function getPrivateResultByAnonymousToken(
  db: PcsDatabase,
  token: string
): Promise<{ snapshotId: string; snapshot: ResultSnapshotV01; createdAt: Date } | null> {
  const tokenHash = hashAnonymousSessionToken(token);
  const [row] = await db
    .select({
      snapshotId: resultSnapshots.snapshotId,
      snapshot: resultSnapshots.snapshotJson,
      createdAt: resultSnapshots.createdAt
    })
    .from(anonymousSessions)
    .innerJoin(resultSnapshots, eq(resultSnapshots.sessionId, anonymousSessions.sessionId))
    .where(
      and(
        eq(anonymousSessions.accessTokenHash, tokenHash),
        eq(anonymousSessions.status, 'completed')
      )
    )
    .limit(1);

  return row ?? null;
}
