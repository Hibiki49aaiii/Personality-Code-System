import type { CoreCodeSchema } from '../../domain/assessment/personalityCode';
import type { InteractionRuleSet } from '../../domain/assessment/interactions';
import codeSchemaV01 from '../../../data/code-schema/v0.1-dev.json';
import interactionRulesV01 from '../../../data/interactions/v0.1.json';

export class RuntimeModelAssetError extends Error {
  constructor(public readonly code: 'UNSUPPORTED_CODE_SCHEMA' | 'UNSUPPORTED_INTERACTION_VERSION', message: string) {
    super(message);
    this.name = 'RuntimeModelAssetError';
  }
}

const CODE_SCHEMAS: Readonly<Record<string, CoreCodeSchema>> = {
  'core-code-v0.1-dev': codeSchemaV01 as CoreCodeSchema
};

const INTERACTION_RULES: Readonly<Record<string, InteractionRuleSet>> = {
  'trait-interactions-v0.1': interactionRulesV01 as InteractionRuleSet
};

export function resolveRuntimeModelAssets(input: {
  codeSchemaVersion: string;
  interactionVersion: string;
}): { codeSchema: CoreCodeSchema; interactionRules: InteractionRuleSet } {
  const codeSchema = CODE_SCHEMAS[input.codeSchemaVersion];
  if (!codeSchema) {
    throw new RuntimeModelAssetError(
      'UNSUPPORTED_CODE_SCHEMA',
      `Runtime has no registered code schema ${input.codeSchemaVersion}`
    );
  }

  const interactionRules = INTERACTION_RULES[input.interactionVersion];
  if (!interactionRules) {
    throw new RuntimeModelAssetError(
      'UNSUPPORTED_INTERACTION_VERSION',
      `Runtime has no registered interaction rules ${input.interactionVersion}`
    );
  }

  return { codeSchema, interactionRules };
}
