import { and, asc, eq } from 'drizzle-orm';
import { LIKERT_5_JA_V01 } from '../../domain/assessment/responseScale';
import { TRAIT_IDS, type ItemDirection, type ScoringItem, type TraitId } from '../../domain/assessment/scoring';
import type { PcsDatabase } from './database';
import {
  assessmentItemRevisions,
  assessmentModelItems,
  assessmentModelReleases
} from './schema';

export class AssessmentModelRepositoryError extends Error {
  constructor(
    public readonly code: 'MODEL_NOT_FOUND' | 'MODEL_NOT_DELIVERABLE' | 'MODEL_CORRUPT',
    message: string
  ) {
    super(message);
    this.name = 'AssessmentModelRepositoryError';
  }
}

export interface AssessmentDeliveryItem {
  position: number;
  id: string;
  revision: string;
  text: string;
  required: boolean;
}

export interface AssessmentDeliveryModel {
  modelVersion: string;
  itemBankVersion: string;
  locale: string;
  responseScale: typeof LIKERT_5_JA_V01;
  items: AssessmentDeliveryItem[];
}

export interface AssessmentScoringModel {
  modelVersion: string;
  itemBankVersion: string;
  scoringVersion: string;
  codeSchemaVersion: string;
  interactionVersion: string;
  contentVersion: string;
  locale: string;
  items: ScoringItem[];
}

function assertTraitId(value: string): TraitId {
  if (!TRAIT_IDS.includes(value as TraitId)) {
    throw new AssessmentModelRepositoryError('MODEL_CORRUPT', `Unknown Trait ID in model mapping: ${value}`);
  }
  return value as TraitId;
}

function assertDirection(value: number): ItemDirection {
  if (value !== 1 && value !== -1) {
    throw new AssessmentModelRepositoryError('MODEL_CORRUPT', `Invalid item direction in model mapping: ${value}`);
  }
  return value;
}

async function getRelease(
  db: PcsDatabase,
  input: { modelVersion: string; locale: string; allowedStatuses: readonly string[] }
) {
  const [release] = await db
    .select({
      modelVersion: assessmentModelReleases.modelVersion,
      status: assessmentModelReleases.status,
      locale: assessmentModelReleases.locale,
      itemBankVersion: assessmentModelReleases.itemBankVersion,
      scoringVersion: assessmentModelReleases.scoringVersion,
      codeSchemaVersion: assessmentModelReleases.codeSchemaVersion,
      interactionVersion: assessmentModelReleases.interactionVersion,
      contentVersion: assessmentModelReleases.contentVersion
    })
    .from(assessmentModelReleases)
    .where(eq(assessmentModelReleases.modelVersion, input.modelVersion))
    .limit(1);

  if (!release) {
    throw new AssessmentModelRepositoryError('MODEL_NOT_FOUND', `Assessment model ${input.modelVersion} does not exist`);
  }
  if (release.locale !== input.locale || !input.allowedStatuses.includes(release.status)) {
    throw new AssessmentModelRepositoryError(
      'MODEL_NOT_DELIVERABLE',
      `Assessment model ${input.modelVersion} is not deliverable for ${input.locale}`
    );
  }
  return release;
}

async function getOrderedMappings(db: PcsDatabase, modelVersion: string) {
  const rows = await db
    .select({
      position: assessmentModelItems.position,
      itemId: assessmentModelItems.itemId,
      itemRevision: assessmentModelItems.itemRevision,
      locale: assessmentModelItems.locale,
      traitId: assessmentModelItems.traitId,
      direction: assessmentModelItems.direction,
      weightMilli: assessmentModelItems.weightMilli,
      required: assessmentModelItems.required,
      text: assessmentItemRevisions.text
    })
    .from(assessmentModelItems)
    .innerJoin(
      assessmentItemRevisions,
      and(
        eq(assessmentItemRevisions.itemId, assessmentModelItems.itemId),
        eq(assessmentItemRevisions.revision, assessmentModelItems.itemRevision),
        eq(assessmentItemRevisions.locale, assessmentModelItems.locale)
      )
    )
    .where(eq(assessmentModelItems.modelVersion, modelVersion))
    .orderBy(asc(assessmentModelItems.position));

  if (rows.length === 0) {
    throw new AssessmentModelRepositoryError('MODEL_CORRUPT', `Assessment model ${modelVersion} has no items`);
  }
  rows.forEach((row, index) => {
    if (row.position !== index + 1) {
      throw new AssessmentModelRepositoryError(
        'MODEL_CORRUPT',
        `Assessment model ${modelVersion} has non-contiguous item positions`
      );
    }
  });
  return rows;
}

export async function getAssessmentDeliveryModel(
  db: PcsDatabase,
  input: {
    modelVersion: string;
    locale: string;
    allowedStatuses?: readonly string[];
  }
): Promise<AssessmentDeliveryModel> {
  const allowedStatuses = input.allowedStatuses ?? ['beta', 'published'];
  const release = await getRelease(db, { ...input, allowedStatuses });
  const rows = await getOrderedMappings(db, input.modelVersion);

  if (release.locale !== LIKERT_5_JA_V01.locale) {
    throw new AssessmentModelRepositoryError(
      'MODEL_CORRUPT',
      `No versioned response scale is registered for locale ${release.locale}`
    );
  }

  return {
    modelVersion: release.modelVersion,
    itemBankVersion: release.itemBankVersion,
    locale: release.locale,
    responseScale: LIKERT_5_JA_V01,
    items: rows.map((row) => ({
      position: row.position,
      id: row.itemId,
      revision: row.itemRevision,
      text: row.text,
      required: row.required
    }))
  };
}

export async function getAssessmentScoringModel(
  db: PcsDatabase,
  input: {
    modelVersion: string;
    locale: string;
    allowedStatuses?: readonly string[];
  }
): Promise<AssessmentScoringModel> {
  const allowedStatuses = input.allowedStatuses ?? ['beta', 'published'];
  const release = await getRelease(db, { ...input, allowedStatuses });
  const rows = await getOrderedMappings(db, input.modelVersion);

  return {
    modelVersion: release.modelVersion,
    itemBankVersion: release.itemBankVersion,
    scoringVersion: release.scoringVersion,
    codeSchemaVersion: release.codeSchemaVersion,
    interactionVersion: release.interactionVersion,
    contentVersion: release.contentVersion,
    locale: release.locale,
    items: rows.map((row) => ({
      id: row.itemId,
      traitId: assertTraitId(row.traitId),
      direction: assertDirection(row.direction),
      weightMilli: row.weightMilli,
      required: row.required
    }))
  };
}
