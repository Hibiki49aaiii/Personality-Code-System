import type { AssessmentAnswer } from '../../domain/assessment/scoring';
import { buildStructuredAssessmentResult } from '../../domain/assessment/resultEngine';
import type { ResultSnapshotV01 } from '../../domain/assessment/resultSnapshot';
import type { PcsDatabase } from '../../infrastructure/persistence/database';
import {
  completeAnonymousAssessment,
  createAnonymousAssessmentSession,
  getPrivateResultByAnonymousToken,
  PersistenceError
} from '../../infrastructure/persistence/anonymousAssessmentRepository';
import {
  getAnonymousAssessmentSessionState,
  getAnonymousAssessmentStoredAnswers,
  saveAnonymousAssessmentAnswerForSessionModel
} from '../../infrastructure/persistence/anonymousAssessmentWorkflowRepository';
import { loadDeliveredAssessmentModel } from '../../infrastructure/persistence/modelDelivery';
import { resolveRuntimeModelAssets } from './runtimeModelAssets';

export const DEVELOPMENT_ASSESSMENT_MODEL_VERSION = 'assessment-dev-v0.1';
export const DEVELOPMENT_ASSESSMENT_LOCALE = 'ja-JP';
export const DEVELOPMENT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const LIKERT_5_JA_V01 = {
  version: 'likert-5-ja-v0.1',
  values: [
    { value: 1, label: 'まったく当てはまらない' },
    { value: 2, label: 'あまり当てはまらない' },
    { value: 3, label: 'どちらともいえない' },
    { value: 4, label: 'やや当てはまる' },
    { value: 5, label: 'とても当てはまる' }
  ]
} as const;

export interface PublicAssessmentItem {
  id: string;
  position: number;
  text: string;
  required: boolean;
}

export interface PublicAssessmentState {
  status: 'in_progress' | 'completed';
  modelVersion: string;
  locale: string;
  expiresAt: string;
  responseScale: typeof LIKERT_5_JA_V01;
  items: PublicAssessmentItem[];
  answers: Array<{ itemId: string; value: number }>;
}

export interface PrivateRenderedResult {
  snapshotId: string;
  createdAt: string;
  snapshot: ResultSnapshotV01;
  sections: Array<{
    domain: ResultSnapshotV01['sections'][number]['domain'];
    modules: Array<{ id: string; text: string }>;
  }>;
}

export async function startOrResumeAnonymousAssessment(
  db: PcsDatabase,
  existingToken?: string
): Promise<{ token: string; expiresAt: Date; created: boolean; state: PublicAssessmentState }> {
  if (existingToken) {
    try {
      const state = await getPublicAssessmentState(db, existingToken);
      return {
        token: existingToken,
        expiresAt: new Date(state.expiresAt),
        created: false,
        state
      };
    } catch (error) {
      if (
        !(error instanceof PersistenceError) ||
        !['SESSION_NOT_FOUND', 'SESSION_EXPIRED'].includes(error.code)
      ) {
        throw error;
      }
    }
  }

  const created = await createAnonymousAssessmentSession(db, {
    modelVersion: DEVELOPMENT_ASSESSMENT_MODEL_VERSION,
    locale: DEVELOPMENT_ASSESSMENT_LOCALE,
    expiresAt: new Date(Date.now() + DEVELOPMENT_SESSION_TTL_MS),
    allowedModelStatuses: ['beta', 'published']
  });
  const state = await getPublicAssessmentState(db, created.token);
  return {
    token: created.token,
    expiresAt: created.expiresAt,
    created: true,
    state
  };
}

export async function getPublicAssessmentState(
  db: PcsDatabase,
  token: string
): Promise<PublicAssessmentState> {
  const session = await getAnonymousAssessmentSessionState(db, token);
  if (session.status !== 'in_progress' && session.status !== 'completed') {
    throw new PersistenceError('SESSION_NOT_WRITABLE', `Unsupported session status ${session.status}`);
  }

  const model = await loadDeliveredAssessmentModel(db, {
    modelVersion: session.modelVersion,
    locale: session.locale,
    allowedStatuses: ['draft', 'beta', 'published', 'retired']
  });
  const answers = await getAnonymousAssessmentStoredAnswers(db, token);

  return {
    status: session.status,
    modelVersion: session.modelVersion,
    locale: session.locale,
    expiresAt: session.expiresAt.toISOString(),
    responseScale: LIKERT_5_JA_V01,
    items: model.items.map((item) => ({
      id: item.id,
      position: item.position,
      text: item.text,
      required: item.required
    })),
    answers: answers.map((answer) => ({ itemId: answer.itemId, value: answer.value }))
  };
}

export async function savePublicAssessmentAnswer(
  db: PcsDatabase,
  input: { token: string; itemId: string; value: number }
): Promise<void> {
  if (!input.itemId || input.itemId.length > 80) {
    throw new PersistenceError('INVALID_ANSWER', 'A valid assessment item ID is required');
  }
  await saveAnonymousAssessmentAnswerForSessionModel(db, input);
}

export async function completePublicAssessment(
  db: PcsDatabase,
  token: string
): Promise<{ snapshotId: string; snapshot: ResultSnapshotV01; alreadyCompleted: boolean }> {
  const existing = await getPrivateResultByAnonymousToken(db, token);
  if (existing) {
    return {
      snapshotId: existing.snapshotId,
      snapshot: existing.snapshot,
      alreadyCompleted: true
    };
  }

  const session = await getAnonymousAssessmentSessionState(db, token);
  if (session.status !== 'in_progress') {
    throw new PersistenceError('SESSION_NOT_WRITABLE', 'Assessment session cannot be completed');
  }

  const model = await loadDeliveredAssessmentModel(db, {
    modelVersion: session.modelVersion,
    locale: session.locale,
    allowedStatuses: ['beta', 'published']
  });
  const storedAnswers = await getAnonymousAssessmentStoredAnswers(db, token);
  const answers: AssessmentAnswer[] = storedAnswers.map((answer) => ({
    itemId: answer.itemId,
    value: answer.value as AssessmentAnswer['value']
  }));
  const assets = resolveRuntimeModelAssets({
    codeSchemaVersion: model.versions.codeSchemaVersion,
    interactionVersion: model.versions.interactionVersion
  });

  const result = buildStructuredAssessmentResult({
    versions: model.versions,
    locale: model.locale,
    scoringItems: model.scoringItems,
    answers,
    codeSchema: assets.codeSchema,
    interactionRules: assets.interactionRules,
    contentModules: model.contentModules
  });

  try {
    const completed = await completeAnonymousAssessment(db, { token, result });
    return {
      snapshotId: completed.snapshotId,
      snapshot: completed.snapshot,
      alreadyCompleted: false
    };
  } catch (error) {
    // Concurrent duplicate submit: the unique snapshot/session + completed-session guards
    // allow only one transaction to win. If another request won, return that immutable result.
    const raced = await getPrivateResultByAnonymousToken(db, token);
    if (raced) {
      return {
        snapshotId: raced.snapshotId,
        snapshot: raced.snapshot,
        alreadyCompleted: true
      };
    }
    throw error;
  }
}

export async function getPrivateRenderedAssessmentResult(
  db: PcsDatabase,
  token: string
): Promise<PrivateRenderedResult | null> {
  const persisted = await getPrivateResultByAnonymousToken(db, token);
  if (!persisted) return null;

  const snapshot = persisted.snapshot;
  const model = await loadDeliveredAssessmentModel(db, {
    modelVersion: snapshot.versions.assessmentModelVersion,
    locale: snapshot.locale,
    allowedStatuses: ['draft', 'beta', 'published', 'retired']
  });
  if (model.versions.contentVersion !== snapshot.versions.contentVersion) {
    throw new Error('Persisted result content version no longer matches its immutable model release');
  }

  const modules = new Map(model.contentModules.map((module) => [module.id, module] as const));
  const sections = snapshot.sections.map((section) => ({
    domain: section.domain,
    modules: section.moduleIds.map((moduleId) => {
      const module = modules.get(moduleId);
      if (!module) {
        throw new Error(`Snapshot references missing immutable content module ${moduleId}`);
      }
      return { id: module.id, text: module.text };
    })
  }));

  return {
    snapshotId: persisted.snapshotId,
    createdAt: persisted.createdAt.toISOString(),
    snapshot,
    sections
  };
}
