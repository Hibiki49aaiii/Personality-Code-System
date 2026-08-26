import codeSchemaData from '../../data/code-schema/v0.1-dev.json';
import interactionData from '../../data/interactions/v0.1.json';
import type { AssessmentAnswer, LikertValue } from '../domain/assessment/scoring';
import type { CoreCodeSchema } from '../domain/assessment/personalityCode';
import type { InteractionRuleSet } from '../domain/assessment/interactions';
import { buildStructuredAssessmentResult, type StructuredAssessmentResult } from '../domain/assessment/resultEngine';
import { getAssessmentScoringModel } from '../infrastructure/persistence/assessmentModelRepository';
import type { AnonymousAssessmentState } from '../infrastructure/persistence/anonymousAssessmentRepository';
import { getContentModulesForVersion } from '../infrastructure/persistence/contentRepository';
import { createPcsDatabaseConnection, type PcsDatabase } from '../infrastructure/persistence/database';

export const DEVELOPMENT_ASSESSMENT_MODEL_VERSION = 'assessment-dev-v0.2';
export const DEVELOPMENT_ASSESSMENT_LOCALE = 'ja-JP';
export const RESULT_SCHEMA_VERSION = 'structured-result-v0.1-dev';

const codeSchema = codeSchemaData as unknown as CoreCodeSchema;
const interactionRules = interactionData as unknown as InteractionRuleSet;

export function requireDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not configured');
  return databaseUrl;
}

export async function withPcsDatabase<T>(work: (db: PcsDatabase) => Promise<T>): Promise<T> {
  const connection = createPcsDatabaseConnection(requireDatabaseUrl());
  try {
    return await work(connection.db);
  } finally {
    await connection.close();
  }
}

function asLikertValue(value: number): LikertValue {
  if (value !== 1 && value !== 2 && value !== 3 && value !== 4 && value !== 5) {
    throw new Error(`Persisted answer is outside the Likert scale: ${value}`);
  }
  return value;
}

export async function buildResultForAnonymousState(
  db: PcsDatabase,
  state: AnonymousAssessmentState
): Promise<StructuredAssessmentResult> {
  if (state.status !== 'in_progress') {
    throw new Error('Only an in-progress assessment can be finalized');
  }

  const scoringModel = await getAssessmentScoringModel(db, {
    modelVersion: state.modelVersion,
    locale: state.locale,
    allowedStatuses: ['beta', 'published']
  });

  if (scoringModel.codeSchemaVersion !== codeSchema.code_schema_version) {
    throw new Error(`Unsupported code schema ${scoringModel.codeSchemaVersion}`);
  }
  if (scoringModel.interactionVersion !== interactionRules.interaction_version) {
    throw new Error(`Unsupported interaction version ${scoringModel.interactionVersion}`);
  }

  const contentModules = await getContentModulesForVersion(
    db,
    scoringModel.contentVersion,
    scoringModel.locale
  );

  const answers: AssessmentAnswer[] = state.answers.map((answer) => ({
    itemId: answer.itemId,
    value: asLikertValue(answer.value)
  }));

  return buildStructuredAssessmentResult({
    versions: {
      resultSchemaVersion: RESULT_SCHEMA_VERSION,
      assessmentModelVersion: scoringModel.modelVersion,
      itemBankVersion: scoringModel.itemBankVersion,
      scoringVersion: scoringModel.scoringVersion,
      codeSchemaVersion: scoringModel.codeSchemaVersion,
      interactionVersion: scoringModel.interactionVersion,
      contentVersion: scoringModel.contentVersion
    },
    locale: scoringModel.locale,
    scoringItems: scoringModel.items,
    answers,
    codeSchema,
    interactionRules,
    contentModules
  });
}
