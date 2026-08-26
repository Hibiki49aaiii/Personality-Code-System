import { and, eq } from 'drizzle-orm';
import type { PcsDatabase } from './database';
import { assessmentModelItems } from './schema';
import {
  getAnonymousAssessmentState,
  PersistenceError,
  saveAnonymousAssessmentAnswer
} from './anonymousAssessmentRepository';

export async function saveAnonymousAssessmentAnswerForSessionModel(
  db: PcsDatabase,
  input: { token: string; itemId: string; value: number }
): Promise<void> {
  const session = await getAnonymousAssessmentState(db, input.token);
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
