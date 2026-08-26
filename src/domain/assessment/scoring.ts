export const TRAIT_IDS = [
  'SYS', 'VER', 'ADV', 'ABS', 'META', 'EMO', 'COG', 'BND', 'RDP', 'REC', 'CON',
  'AUT', 'EXE', 'OPT', 'FIN', 'NOV', 'PER', 'RSK', 'UNC', 'STR', 'CRE'
] as const;

export type TraitId = (typeof TRAIT_IDS)[number];
export type LikertValue = 1 | 2 | 3 | 4 | 5;
export type ItemDirection = 1 | -1;

export interface ScoringItem {
  id: string;
  traitId: TraitId;
  direction: ItemDirection;
  /** Integer weight units. v0.1 uses 1000 for weight 1.0. */
  weightMilli: number;
  required: boolean;
}

export interface AssessmentAnswer {
  itemId: string;
  value: LikertValue;
}

export interface TraitScore {
  traitId: TraitId;
  keyedPointsWeighted: number;
  maxPointsWeighted: number;
  /** Canonical 0..10000 integer score. 100 basis points = one public score point. */
  scoreBp: number;
  /** Convenience representation with at most two decimals; scoreBp remains canonical. */
  score: number;
  /** Integer 0..100 display score using deterministic half-up rounding. */
  displayScore: number;
  answeredItems: number;
}

export type ResponseQualityFlag =
  | 'dominant_response_pattern'
  | 'all_midpoint_responses';

export interface ResponseQualityMetadata {
  answerCount: number;
  valueCounts: Record<LikertValue, number>;
  dominantResponseShareBp: number;
  extremeResponseShareBp: number;
  flags: ResponseQualityFlag[];
}

export interface AssessmentScoreResult {
  scoringVersion: string;
  traitScores: TraitScore[];
  responseQuality: ResponseQualityMetadata;
}

export class AssessmentInputError extends Error {
  readonly code:
    | 'DUPLICATE_ITEM_ID'
    | 'INVALID_ITEM'
    | 'DUPLICATE_ANSWER'
    | 'UNKNOWN_ITEM'
    | 'INVALID_RESPONSE'
    | 'MISSING_REQUIRED_ANSWER';

  constructor(code: AssessmentInputError['code'], message: string) {
    super(message);
    this.name = 'AssessmentInputError';
    this.code = code;
  }
}

function assertSafeNonNegativeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new AssessmentInputError('INVALID_ITEM', `${label} must be a non-negative safe integer`);
  }
}

/** Deterministic round-half-up for non-negative integer numerator/denominator. */
export function roundHalfUpDiv(numerator: number, denominator: number): number {
  assertSafeNonNegativeInteger(numerator, 'numerator');
  if (!Number.isSafeInteger(denominator) || denominator <= 0) {
    throw new AssessmentInputError('INVALID_ITEM', 'denominator must be a positive safe integer');
  }
  const doubled = numerator * 2;
  if (!Number.isSafeInteger(doubled + denominator) || !Number.isSafeInteger(denominator * 2)) {
    throw new AssessmentInputError('INVALID_ITEM', 'rounding operands exceed safe integer range');
  }
  return Math.floor((doubled + denominator) / (denominator * 2));
}

export function keyedLikertPoints(value: LikertValue, direction: ItemDirection): number {
  return direction === 1 ? value - 1 : 5 - value;
}

function validateItems(items: readonly ScoringItem[]): Map<string, ScoringItem> {
  const itemMap = new Map<string, ScoringItem>();
  for (const item of items) {
    if (itemMap.has(item.id)) {
      throw new AssessmentInputError('DUPLICATE_ITEM_ID', `Duplicate scoring item: ${item.id}`);
    }
    if (!TRAIT_IDS.includes(item.traitId)) {
      throw new AssessmentInputError('INVALID_ITEM', `Unknown trait on ${item.id}: ${item.traitId}`);
    }
    if (item.direction !== 1 && item.direction !== -1) {
      throw new AssessmentInputError('INVALID_ITEM', `Invalid direction on ${item.id}`);
    }
    if (!Number.isSafeInteger(item.weightMilli) || item.weightMilli <= 0) {
      throw new AssessmentInputError('INVALID_ITEM', `weightMilli must be a positive integer on ${item.id}`);
    }
    itemMap.set(item.id, item);
  }
  return itemMap;
}

function validateAnswers(
  itemMap: ReadonlyMap<string, ScoringItem>,
  answers: readonly AssessmentAnswer[]
): Map<string, LikertValue> {
  const answerMap = new Map<string, LikertValue>();
  for (const answer of answers) {
    if (answerMap.has(answer.itemId)) {
      throw new AssessmentInputError('DUPLICATE_ANSWER', `Duplicate answer: ${answer.itemId}`);
    }
    if (!itemMap.has(answer.itemId)) {
      throw new AssessmentInputError('UNKNOWN_ITEM', `Answer references unknown item: ${answer.itemId}`);
    }
    if (![1, 2, 3, 4, 5].includes(answer.value)) {
      throw new AssessmentInputError('INVALID_RESPONSE', `Invalid response for ${answer.itemId}`);
    }
    answerMap.set(answer.itemId, answer.value);
  }
  for (const item of itemMap.values()) {
    if (item.required && !answerMap.has(item.id)) {
      throw new AssessmentInputError('MISSING_REQUIRED_ANSWER', `Missing required answer: ${item.id}`);
    }
  }
  return answerMap;
}

function computeResponseQuality(answers: readonly AssessmentAnswer[]): ResponseQualityMetadata {
  const valueCounts: Record<LikertValue, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const answer of answers) valueCounts[answer.value] += 1;

  const total = answers.length;
  if (total === 0) {
    return {
      answerCount: 0,
      valueCounts,
      dominantResponseShareBp: 0,
      extremeResponseShareBp: 0,
      flags: []
    };
  }

  const dominant = Math.max(...Object.values(valueCounts));
  const extreme = valueCounts[1] + valueCounts[5];
  const dominantResponseShareBp = roundHalfUpDiv(dominant * 10000, total);
  const extremeResponseShareBp = roundHalfUpDiv(extreme * 10000, total);
  const flags: ResponseQualityFlag[] = [];

  if (dominantResponseShareBp >= 9000) flags.push('dominant_response_pattern');
  if (valueCounts[3] === total) flags.push('all_midpoint_responses');

  return {
    answerCount: total,
    valueCounts,
    dominantResponseShareBp,
    extremeResponseShareBp,
    flags
  };
}

export function scoreAssessment(input: {
  scoringVersion: string;
  items: readonly ScoringItem[];
  answers: readonly AssessmentAnswer[];
}): AssessmentScoreResult {
  const itemMap = validateItems(input.items);
  const answerMap = validateAnswers(itemMap, input.answers);

  const accumulators = new Map<TraitId, {
    keyedPointsWeighted: number;
    maxPointsWeighted: number;
    answeredItems: number;
  }>();

  for (const item of input.items) {
    const answer = answerMap.get(item.id);
    if (answer === undefined) continue;

    const current = accumulators.get(item.traitId) ?? {
      keyedPointsWeighted: 0,
      maxPointsWeighted: 0,
      answeredItems: 0
    };
    const points = keyedLikertPoints(answer, item.direction);
    current.keyedPointsWeighted += points * item.weightMilli;
    current.maxPointsWeighted += 4 * item.weightMilli;
    current.answeredItems += 1;
    accumulators.set(item.traitId, current);
  }

  const traitScores: TraitScore[] = [...accumulators.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([traitId, value]) => {
      const scoreBp = roundHalfUpDiv(value.keyedPointsWeighted * 10000, value.maxPointsWeighted);
      return {
        traitId,
        keyedPointsWeighted: value.keyedPointsWeighted,
        maxPointsWeighted: value.maxPointsWeighted,
        scoreBp,
        score: scoreBp / 100,
        displayScore: roundHalfUpDiv(scoreBp, 100),
        answeredItems: value.answeredItems
      };
    });

  return {
    scoringVersion: input.scoringVersion,
    traitScores,
    responseQuality: computeResponseQuality(input.answers)
  };
}
