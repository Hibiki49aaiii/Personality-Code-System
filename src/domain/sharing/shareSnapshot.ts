import type { ResultSnapshot } from '../assessment/resultSnapshot';

export const SHARE_SNAPSHOT_SCHEMA_VERSION = 'share-snapshot-v0.1-dev' as const;

export interface SharePresentationV01 {
  displayName: string | null;
  identitySentence: string | null;
  illustrationAssetVersion: string | null;
}

export interface ShareSnapshotV01 {
  shareSchemaVersion: typeof SHARE_SNAPSHOT_SCHEMA_VERSION;
  sourceResultSnapshotSchemaVersion: ResultSnapshot['snapshotSchemaVersion'];
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
  source: ResultSnapshot,
  presentation?: SharePresentationV01
): ShareSnapshotV01 {
  const resolvedPresentation: SharePresentationV01 = presentation ?? {
    displayName: null,
    identitySentence: null,
    illustrationAssetVersion: 'assets' in source ? source.assets.illustrationAssetVersion : null
  };
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
      displayName: resolvedPresentation.displayName,
      identitySentence: resolvedPresentation.identitySentence,
      illustrationAssetVersion: resolvedPresentation.illustrationAssetVersion
    }
  };
}
