import { and, asc, eq } from 'drizzle-orm';
import type { ContentModule } from '../../domain/assessment/contentComposer';
import type { ResultVersionSet } from '../../domain/assessment/resultEngine';
import type { ScoringItem } from '../../domain/assessment/scoring';
import type { PcsDatabase } from './database';
import {
  assessmentItemRevisions,
  assessmentModelItems,
  assessmentModelReleases,
  contentModules,
  contentVersions
} from './schema';

export class ModelDeliveryError extends Error {
  constructor(
    public readonly code:
      | 'MODEL_NOT_AVAILABLE'
      | 'MODEL_INCOMPLETE'
      | 'CONTENT_NOT_AVAILABLE'
      | 'RESULT_SCHEMA_NOT_MAPPED',
    message: string
  ) {
    super(message);
    this.name = 'ModelDeliveryError';
  }
}

export interface DeliveredAssessmentItem {
  id: string;
  revision: string;
  locale: string;
  position: number;
  text: string;
  traitId: ScoringItem['traitId'];
  direction: ScoringItem['direction'];
  weightMilli: number;
  required: boolean;
}

export interface DeliveredAssessmentModel {
  modelVersion: string;
  status: string;
  locale: string;
  traitDictionaryVersion: string;
  versions: ResultVersionSet;
  items: DeliveredAssessmentItem[];
  scoringItems: ScoringItem[];
  contentModules: ContentModule[];
}

const RESULT_SCHEMA_BY_MODEL: Readonly<Record<string, string>> = {
  'assessment-dev-v0.1': 'structured-result-v0.1-dev'
};

export async function loadDeliveredAssessmentModel(
  db: PcsDatabase,
  input: {
    modelVersion: string;
    locale: string;
    allowedStatuses?: readonly string[];
  }
): Promise<DeliveredAssessmentModel> {
  const allowedStatuses = input.allowedStatuses ?? ['beta', 'published'];
  const [model] = await db
    .select({
      modelVersion: assessmentModelReleases.modelVersion,
      status: assessmentModelReleases.status,
      locale: assessmentModelReleases.locale,
      traitDictionaryVersion: assessmentModelReleases.traitDictionaryVersion,
      itemBankVersion: assessmentModelReleases.itemBankVersion,
      scoringVersion: assessmentModelReleases.scoringVersion,
      codeSchemaVersion: assessmentModelReleases.codeSchemaVersion,
      interactionVersion: assessmentModelReleases.interactionVersion,
      contentVersion: assessmentModelReleases.contentVersion
    })
    .from(assessmentModelReleases)
    .where(eq(assessmentModelReleases.modelVersion, input.modelVersion))
    .limit(1);

  if (!model || model.locale !== input.locale || !allowedStatuses.includes(model.status)) {
    throw new ModelDeliveryError(
      'MODEL_NOT_AVAILABLE',
      `Assessment model ${input.modelVersion} is not available for ${input.locale}`
    );
  }

  const resultSchemaVersion = RESULT_SCHEMA_BY_MODEL[model.modelVersion];
  if (!resultSchemaVersion) {
    throw new ModelDeliveryError(
      'RESULT_SCHEMA_NOT_MAPPED',
      `No structured-result schema mapping exists for ${model.modelVersion}`
    );
  }

  const itemRows = await db
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
    .where(eq(assessmentModelItems.modelVersion, model.modelVersion))
    .orderBy(asc(assessmentModelItems.position));

  if (itemRows.length === 0) {
    throw new ModelDeliveryError('MODEL_INCOMPLETE', `${model.modelVersion} has no delivered assessment items`);
  }
  for (let index = 0; index < itemRows.length; index += 1) {
    if (itemRows[index].position !== index + 1) {
      throw new ModelDeliveryError(
        'MODEL_INCOMPLETE',
        `${model.modelVersion} item positions are not contiguous at ${index + 1}`
      );
    }
    if (itemRows[index].locale !== model.locale) {
      throw new ModelDeliveryError(
        'MODEL_INCOMPLETE',
        `${itemRows[index].itemId} locale does not match model locale`
      );
    }
  }

  const [contentVersion] = await db
    .select({ locale: contentVersions.locale, status: contentVersions.status })
    .from(contentVersions)
    .where(eq(contentVersions.contentVersion, model.contentVersion))
    .limit(1);
  if (!contentVersion || contentVersion.locale !== model.locale) {
    throw new ModelDeliveryError(
      'CONTENT_NOT_AVAILABLE',
      `Content ${model.contentVersion} is not available for ${model.locale}`
    );
  }

  const contentRows = await db
    .select({ moduleId: contentModules.moduleId, moduleJson: contentModules.moduleJson })
    .from(contentModules)
    .where(eq(contentModules.contentVersion, model.contentVersion))
    .orderBy(asc(contentModules.moduleId));
  if (contentRows.length === 0) {
    throw new ModelDeliveryError('CONTENT_NOT_AVAILABLE', `Content ${model.contentVersion} has no modules`);
  }

  const items: DeliveredAssessmentItem[] = itemRows.map((row) => ({
    id: row.itemId,
    revision: row.itemRevision,
    locale: row.locale,
    position: row.position,
    text: row.text,
    traitId: row.traitId as DeliveredAssessmentItem['traitId'],
    direction: row.direction as DeliveredAssessmentItem['direction'],
    weightMilli: row.weightMilli,
    required: row.required
  }));

  return {
    modelVersion: model.modelVersion,
    status: model.status,
    locale: model.locale,
    traitDictionaryVersion: model.traitDictionaryVersion,
    versions: {
      resultSchemaVersion,
      assessmentModelVersion: model.modelVersion,
      itemBankVersion: model.itemBankVersion,
      scoringVersion: model.scoringVersion,
      codeSchemaVersion: model.codeSchemaVersion,
      interactionVersion: model.interactionVersion,
      contentVersion: model.contentVersion
    },
    items,
    scoringItems: items.map((item) => ({
      id: item.id,
      traitId: item.traitId,
      direction: item.direction,
      weightMilli: item.weightMilli,
      required: item.required
    })),
    contentModules: contentRows.map((row) => {
      const module = row.moduleJson as ContentModule;
      if (module.id !== row.moduleId || module.content_version !== model.contentVersion) {
        throw new ModelDeliveryError(
          'CONTENT_NOT_AVAILABLE',
          `Persisted content module ${row.moduleId} does not match its versioned payload`
        );
      }
      return module;
    })
  };
}
