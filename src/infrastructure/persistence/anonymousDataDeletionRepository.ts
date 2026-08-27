import { eq } from 'drizzle-orm';
import { hashAnonymousSessionToken } from './sessionToken';
import { anonymousSessions, resultSnapshots } from './schema';
import { publicShareSnapshots } from './sharingSchema';
import type { PcsDatabase } from './database';

export class AnonymousDataDeletionError extends Error {
  constructor(
    public readonly code: 'SESSION_NOT_FOUND',
    message: string
  ) {
    super(message);
    this.name = 'AnonymousDataDeletionError';
  }
}

export interface AnonymousDataDeletionResult {
  sessionId: string;
  deletedPublicShareCount: number;
  hadCompletedResult: boolean;
}

export async function deleteAnonymousAssessmentDataByToken(
  db: PcsDatabase,
  token: string
): Promise<AnonymousDataDeletionResult> {
  const tokenHash = hashAnonymousSessionToken(token);

  return db.transaction(async (tx) => {
    const [session] = await tx
      .select({ sessionId: anonymousSessions.sessionId })
      .from(anonymousSessions)
      .where(eq(anonymousSessions.accessTokenHash, tokenHash))
      .limit(1);

    if (!session) {
      throw new AnonymousDataDeletionError(
        'SESSION_NOT_FOUND',
        'Anonymous assessment session was not found'
      );
    }

    const [snapshot] = await tx
      .select({ snapshotId: resultSnapshots.snapshotId })
      .from(resultSnapshots)
      .where(eq(resultSnapshots.sessionId, session.sessionId))
      .limit(1);

    let deletedPublicShareCount = 0;
    if (snapshot) {
      const deletedShares = await tx
        .delete(publicShareSnapshots)
        .where(eq(publicShareSnapshots.sourceResultSnapshotId, snapshot.snapshotId))
        .returning({ shareSnapshotId: publicShareSnapshots.shareSnapshotId });
      deletedPublicShareCount = deletedShares.length;
    }

    const deletedSessions = await tx
      .delete(anonymousSessions)
      .where(eq(anonymousSessions.sessionId, session.sessionId))
      .returning({ sessionId: anonymousSessions.sessionId });

    if (deletedSessions.length !== 1) {
      throw new Error('Anonymous assessment data deletion did not delete exactly one owning session');
    }

    return {
      sessionId: session.sessionId,
      deletedPublicShareCount,
      hadCompletedResult: Boolean(snapshot)
    };
  });
}
