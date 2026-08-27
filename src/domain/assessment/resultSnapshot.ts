import type { StructuredAssessmentResult, ResultVersionSet } from './resultEngine';
import type { ContentDomain } from './contentComposer';

export interface ResultSnapshotTraitScore {
  traitId: string;
  scoreBp: number;
}

export interface ResultSnapshotSection {
  domain: ContentDomain;
  moduleIds: string[];
}

export interface ResultSnapshotV01 {
  snapshotSchemaVersion: 'result-snapshot-v0.1-dev';
  versions: ResultVersionSet;
  locale: string;
  traitScores: ResultSnapshotTraitScore[];
  responseQuality: StructuredAssessmentResult['scoring']['responseQuality'];
  personalityCode: StructuredAssessmentResult['personalityCode'];
  interactionActiveIds: string[];
  content: {
    selectedIds: string[];
    suppressed: Array<{
      id: string;
      domain: ContentDomain;
      reason: string;
      blockingTags: string[];
    }>;
  };
  sections: ResultSnapshotSection[];
}

export interface ResultSnapshotV02 extends Omit<ResultSnapshotV01, 'snapshotSchemaVersion'> {
  snapshotSchemaVersion: 'result-snapshot-v0.2-dev';
  assets: {
    illustrationAssetVersion: string;
  };
}

export type ResultSnapshot = ResultSnapshotV01 | ResultSnapshotV02;

function snapshotBody(result: StructuredAssessmentResult): Omit<ResultSnapshotV01, 'snapshotSchemaVersion'> {
  return {
    versions: { ...result.versions },
    locale: result.locale,
    traitScores: result.scoring.traitScores.map((trait) => ({
      traitId: trait.traitId,
      scoreBp: trait.scoreBp
    })),
    responseQuality: {
      ...result.scoring.responseQuality,
      valueCounts: { ...result.scoring.responseQuality.valueCounts },
      flags: [...result.scoring.responseQuality.flags]
    },
    personalityCode: {
      ...result.personalityCode,
      dimensions: result.personalityCode.dimensions.map((dimension) => ({ ...dimension }))
    },
    interactionActiveIds: [...result.interactions.activeIds],
    content: {
      selectedIds: [...result.content.selectedIds],
      suppressed: result.content.suppressed.map((module) => ({
        id: module.id,
        domain: module.domain,
        reason: module.reason,
        blockingTags: [...module.blockingTags]
      }))
    },
    sections: result.sections.map((section) => ({
      domain: section.domain,
      moduleIds: [...section.moduleIds]
    }))
  };
}

export function createResultSnapshotV01(result: StructuredAssessmentResult): ResultSnapshotV01 {
  return {
    snapshotSchemaVersion: 'result-snapshot-v0.1-dev',
    ...snapshotBody(result)
  };
}

export function createResultSnapshot(result: StructuredAssessmentResult): ResultSnapshotV01;
export function createResultSnapshot(
  result: StructuredAssessmentResult,
  input: { illustrationAssetVersion: string }
): ResultSnapshotV02;
export function createResultSnapshot(
  result: StructuredAssessmentResult,
  input?: { illustrationAssetVersion: string }
): ResultSnapshot {
  if (!input) return createResultSnapshotV01(result);
  if (!input.illustrationAssetVersion || input.illustrationAssetVersion.length > 120) {
    throw new Error('A valid illustrationAssetVersion is required for result-snapshot-v0.2-dev');
  }
  return {
    snapshotSchemaVersion: 'result-snapshot-v0.2-dev',
    ...snapshotBody(result),
    assets: {
      illustrationAssetVersion: input.illustrationAssetVersion
    }
  };
}
