import type { ResultSnapshotV01 } from '../assessment/resultSnapshot';

export const SHARE_SNAPSHOT_SCHEMA_VERSION = 'share-snapshot-v0.1-dev' as const;

export interface SharePresentationV01 {
  displayName: string | null;
  identitySentence: string | null;
  illustrationAssetVersion: string | null;
}

export interface ShareSnapshotV01 {
  shareSchemaVersion: typeof SHARE_SNAPSHOT_SCHEMA_VERSION;
  sourceResultSnapshotSchemaVersion: ResultSnapshotV01['snapshotSchemaVersion'];
  versions: {
    assessmentModelVersion: string;
    codeSchemaVersion: string;
    contentVersion: string;
  };
  locale: string;
  coreCode: string;
  presentation: SharePresentationV01;
}

export function createSanitizedShareSnapshot(
  source: ResultSnapshotV01,
  presentation: SharePresentationV01 = {
    displayName: null,
    identitySentence: null,
    illustrationAssetVersion: null
  }
): ShareSnapshotV01 {
  return {
    shareSchemaVersion: SHARE_SNAPSHOT_SCHEMA_VERSION,
    sourceResultSnapshotSchemaVersion: source.snapshotSchemaVersion,
    versions: {
      assessmentModelVersion: source.versions.assessmentModelVersion,
      codeSchemaVersion: source.versions.codeSchemaVersion,
      contentVersion: source.versions.contentVersion
    },
    locale: source.locale,
    coreCode: source.personalityCode.coreCode,
    presentation: {
      displayName: presentation.displayName,
      identitySentence: presentation.identitySentence,
      illustrationAssetVersion: presentation.illustrationAssetVersion
    }
  };
}
