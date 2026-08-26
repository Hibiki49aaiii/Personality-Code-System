import { and, eq, gt, isNull, or } from 'drizzle-orm';
import {
  createSanitizedShareSnapshot,
  type SharePresentationV01,
  type ShareSnapshotV01
} from '../../domain/sharing/shareSnapshot';
import { getPrivateResultByAnonymousToken } from './anonymousAssessmentRepository';
import type { PcsDatabase } from './database';
import { createPublicShareCredential, hashPublicShareToken } from './publicShareToken';
import { publicShareSnapshots } from './sharingSchema';

export type PublicShareRepositoryErrorCode =
  | 'PRIVATE_RESULT_NOT_FOUND'
  | 'INVALID_EXPIRY';

export class PublicShareRepositoryError extends Error {
  constructor(
    public readonly code: PublicShareRepositoryErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'PublicShareRepositoryError';
  }
}

export interface CreatedPublicShare {
  shareSnapshotId: string;
  token: string;
  snapshot: ShareSnapshotV01;
  createdAt: Date;
  expiresAt: Date | null;
}

export async function createPublicShareForPrivateResult(
  db: PcsDatabase,
  input: {
    privateToken: string;
    presentation?: SharePresentationV01;
    expiresAt?: Date | null;
  }
): Promise<CreatedPublicShare> {
  const privateResult = await getPrivateResultByAnonymousToken(db, input.privateToken);
  if (!privateResult) {
    throw new PublicShareRepositoryError(
      'PRIVATE_RESULT_NOT_FOUND',
      'A completed private result is required before creating a public share'
    );
  }

  if (
    input.expiresAt !== undefined &&
    input.expiresAt !== null &&
    (!(input.expiresAt instanceof Date) ||
      Number.isNaN(input.expiresAt.getTime()) ||
      input.expiresAt.getTime() <= Date.now())
  ) {
    throw new PublicShareRepositoryError('INVALID_EXPIRY', 'expiresAt must be null or a future Date');
  }

  const credential = createPublicShareCredential();
  const snapshot = createSanitizedShareSnapshot(
    privateResult.snapshot,
    input.presentation
  );

  const [created] = await db
    .insert(publicShareSnapshots)
    .values({
      publicTokenHash: credential.tokenHashHex,
      sourceResultSnapshotId: privateResult.snapshotId,
      shareSchemaVersion: snapshot.shareSchemaVersion,
      assessmentModelVersion: snapshot.versions.assessmentModelVersion,
      codeSchemaVersion: snapshot.versions.codeSchemaVersion,
      contentVersion: snapshot.versions.contentVersion,
      locale: snapshot.locale,
      status: 'active',
      shareJson: snapshot,
      expiresAt: input.expiresAt ?? null
    })
    .returning({
      shareSnapshotId: publicShareSnapshots.shareSnapshotId,
      createdAt: publicShareSnapshots.createdAt,
      expiresAt: publicShareSnapshots.expiresAt
    });

  if (!created) throw new Error('Failed to create public share snapshot');

  return {
    shareSnapshotId: created.shareSnapshotId,
    token: credential.token,
    snapshot,
    createdAt: created.createdAt,
    expiresAt: created.expiresAt
  };
}

export async function getPublicShareByToken(
  db: PcsDatabase,
  token: string
): Promise<{
  shareSnapshotId: string;
  snapshot: ShareSnapshotV01;
  createdAt: Date;
  expiresAt: Date | null;
} | null> {
  let tokenHash: string;
  try {
    tokenHash = hashPublicShareToken(token);
  } catch {
    return null;
  }

  const now = new Date();
  const [row] = await db
    .select({
      shareSnapshotId: publicShareSnapshots.shareSnapshotId,
      snapshot: publicShareSnapshots.shareJson,
      createdAt: publicShareSnapshots.createdAt,
      expiresAt: publicShareSnapshots.expiresAt
    })
    .from(publicShareSnapshots)
    .where(
      and(
        eq(publicShareSnapshots.publicTokenHash, tokenHash),
        eq(publicShareSnapshots.status, 'active'),
        or(
          isNull(publicShareSnapshots.expiresAt),
          gt(publicShareSnapshots.expiresAt, now)
        )
      )
    )
    .limit(1);

  return row ?? null;
}

export async function revokePublicSharesForPrivateResult(
  db: PcsDatabase,
  privateToken: string
): Promise<{ revokedCount: number }> {
  const privateResult = await getPrivateResultByAnonymousToken(db, privateToken);
  if (!privateResult) {
    throw new PublicShareRepositoryError(
      'PRIVATE_RESULT_NOT_FOUND',
      'A completed private result is required to revoke public shares'
    );
  }

  const revokedAt = new Date();
  const revoked = await db
    .update(publicShareSnapshots)
    .set({ status: 'revoked', revokedAt })
    .where(
      and(
        eq(publicShareSnapshots.sourceResultSnapshotId, privateResult.snapshotId),
        eq(publicShareSnapshots.status, 'active')
      )
    )
    .returning({ shareSnapshotId: publicShareSnapshots.shareSnapshotId });

  return { revokedCount: revoked.length };
}
