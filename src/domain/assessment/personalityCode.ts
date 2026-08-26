import { TRAIT_IDS, type TraitId, type TraitScore } from './scoring';

export interface CoreCodeAxis {
  position: number;
  trait_id: TraitId;
  threshold_bp: number;
  high_symbol: string;
  low_symbol: string;
  high_label_ja: string;
  low_label_ja: string;
}

export interface ExtendedCodeFormat {
  version: string;
  band_boundaries_bp: [number, number, number, number];
  grammar: string;
  trait_order: TraitId[];
}

export interface CoreCodeSchema {
  code_schema_version: string;
  schema_token: string;
  status: string;
  public_use: boolean;
  source_trait_dictionary: string;
  boundary_rule: string;
  boundary_margin_bp: number;
  selection_note: string;
  axes: CoreCodeAxis[];
  extended_format: ExtendedCodeFormat;
}

export type TraitBand = 1 | 2 | 3 | 4 | 5;

export interface CoreDimensionResult {
  position: number;
  traitId: TraitId;
  scoreBp: number;
  thresholdBp: number;
  symbol: string;
  pole: 'high' | 'low';
  distanceFromBoundaryBp: number;
  nearBoundary: boolean;
}

export interface PersonalityCodeResult {
  codeSchemaVersion: string;
  schemaToken: string;
  coreCode: string;
  dimensions: CoreDimensionResult[];
  nearBoundaryCount: number;
  extendedCode: string;
}

export class PersonalityCodeError extends Error {
  constructor(
    public readonly code:
      | 'INVALID_SCHEMA'
      | 'DUPLICATE_TRAIT_SCORE'
      | 'INVALID_TRAIT_SCORE'
      | 'MISSING_TRAIT_SCORE',
    message: string
  ) {
    super(message);
    this.name = 'PersonalityCodeError';
  }
}

function assertIntegerInRange(value: number, min: number, max: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new PersonalityCodeError('INVALID_SCHEMA', `${label} must be an integer in ${min}..${max}`);
  }
}

function validateSchema(schema: CoreCodeSchema): CoreCodeAxis[] {
  if (!schema.code_schema_version.trim()) {
    throw new PersonalityCodeError('INVALID_SCHEMA', 'code_schema_version is required');
  }
  if (!/^[A-Z0-9]{2,8}$/.test(schema.schema_token)) {
    throw new PersonalityCodeError('INVALID_SCHEMA', 'schema_token must be 2..8 uppercase alphanumeric characters');
  }
  assertIntegerInRange(schema.boundary_margin_bp, 0, 10000, 'boundary_margin_bp');
  if (!Array.isArray(schema.axes) || schema.axes.length === 0) {
    throw new PersonalityCodeError('INVALID_SCHEMA', 'at least one core axis is required');
  }

  const sorted = [...schema.axes].sort((a, b) => a.position - b.position);
  const seenTraits = new Set<TraitId>();
  const seenPositions = new Set<number>();
  sorted.forEach((axis, index) => {
    assertIntegerInRange(axis.position, 1, 99, `position for ${axis.trait_id}`);
    if (axis.position !== index + 1) {
      throw new PersonalityCodeError('INVALID_SCHEMA', 'core axis positions must be contiguous from 1');
    }
    if (seenPositions.has(axis.position)) {
      throw new PersonalityCodeError('INVALID_SCHEMA', `duplicate core axis position ${axis.position}`);
    }
    seenPositions.add(axis.position);
    if (!TRAIT_IDS.includes(axis.trait_id)) {
      throw new PersonalityCodeError('INVALID_SCHEMA', `unknown core trait ${axis.trait_id}`);
    }
    if (seenTraits.has(axis.trait_id)) {
      throw new PersonalityCodeError('INVALID_SCHEMA', `duplicate core trait ${axis.trait_id}`);
    }
    seenTraits.add(axis.trait_id);
    assertIntegerInRange(axis.threshold_bp, 0, 10000, `threshold for ${axis.trait_id}`);
    if (!/^[A-Z]$/.test(axis.high_symbol) || !/^[A-Z]$/.test(axis.low_symbol)) {
      throw new PersonalityCodeError('INVALID_SCHEMA', `symbols for ${axis.trait_id} must be one A-Z letter`);
    }
    if (axis.high_symbol === axis.low_symbol) {
      throw new PersonalityCodeError('INVALID_SCHEMA', `high/low symbols must differ for ${axis.trait_id}`);
    }
  });

  const boundaries = schema.extended_format.band_boundaries_bp;
  if (!Array.isArray(boundaries) || boundaries.length !== 4) {
    throw new PersonalityCodeError('INVALID_SCHEMA', 'extended format requires four band boundaries');
  }
  let previous = 0;
  for (const [index, boundary] of boundaries.entries()) {
    assertIntegerInRange(boundary, 1, 9999, `band boundary ${index + 1}`);
    if (boundary <= previous) {
      throw new PersonalityCodeError('INVALID_SCHEMA', 'band boundaries must be strictly increasing');
    }
    previous = boundary;
  }

  const extendedTraits = schema.extended_format.trait_order;
  if (extendedTraits.length !== TRAIT_IDS.length || new Set(extendedTraits).size !== TRAIT_IDS.length) {
    throw new PersonalityCodeError('INVALID_SCHEMA', 'extended trait order must contain each retained trait exactly once');
  }
  for (const trait of TRAIT_IDS) {
    if (!extendedTraits.includes(trait)) {
      throw new PersonalityCodeError('INVALID_SCHEMA', `extended trait order missing ${trait}`);
    }
  }

  return sorted;
}

function scoreMap(traitScores: readonly TraitScore[]): Map<TraitId, number> {
  const map = new Map<TraitId, number>();
  for (const score of traitScores) {
    if (map.has(score.traitId)) {
      throw new PersonalityCodeError('DUPLICATE_TRAIT_SCORE', `duplicate trait score ${score.traitId}`);
    }
    if (!Number.isSafeInteger(score.scoreBp) || score.scoreBp < 0 || score.scoreBp > 10000) {
      throw new PersonalityCodeError('INVALID_TRAIT_SCORE', `invalid scoreBp for ${score.traitId}`);
    }
    map.set(score.traitId, score.scoreBp);
  }
  return map;
}

export function traitBandFromScoreBp(
  scoreBp: number,
  boundaries: readonly [number, number, number, number] = [2000, 4000, 6000, 8000]
): TraitBand {
  if (!Number.isSafeInteger(scoreBp) || scoreBp < 0 || scoreBp > 10000) {
    throw new PersonalityCodeError('INVALID_TRAIT_SCORE', `scoreBp ${scoreBp} is outside 0..10000`);
  }
  if (scoreBp < boundaries[0]) return 1;
  if (scoreBp < boundaries[1]) return 2;
  if (scoreBp < boundaries[2]) return 3;
  if (scoreBp < boundaries[3]) return 4;
  return 5;
}

export function generatePersonalityCode(
  traitScores: readonly TraitScore[],
  schema: CoreCodeSchema
): PersonalityCodeResult {
  const axes = validateSchema(schema);
  const scores = scoreMap(traitScores);
  const dimensions: CoreDimensionResult[] = axes.map((axis) => {
    const scoreBp = scores.get(axis.trait_id);
    if (scoreBp === undefined) {
      throw new PersonalityCodeError('MISSING_TRAIT_SCORE', `missing core trait score ${axis.trait_id}`);
    }
    const high = scoreBp >= axis.threshold_bp;
    const distanceFromBoundaryBp = Math.abs(scoreBp - axis.threshold_bp);
    return {
      position: axis.position,
      traitId: axis.trait_id,
      scoreBp,
      thresholdBp: axis.threshold_bp,
      symbol: high ? axis.high_symbol : axis.low_symbol,
      pole: high ? 'high' : 'low',
      distanceFromBoundaryBp,
      nearBoundary: distanceFromBoundaryBp <= schema.boundary_margin_bp
    };
  });

  for (const trait of schema.extended_format.trait_order) {
    if (scores.get(trait) === undefined) {
      throw new PersonalityCodeError('MISSING_TRAIT_SCORE', `missing extended trait score ${trait}`);
    }
  }

  const coreCode = dimensions.map((dimension) => dimension.symbol).join('');
  const extendedPayload = schema.extended_format.trait_order
    .map((trait) => `${trait}${traitBandFromScoreBp(scores.get(trait)!, schema.extended_format.band_boundaries_bp)}`)
    .join('.');
  const extendedCode = `${schema.extended_format.version}~${schema.schema_token}~${coreCode}~${extendedPayload}`;

  return {
    codeSchemaVersion: schema.code_schema_version,
    schemaToken: schema.schema_token,
    coreCode,
    dimensions,
    nearBoundaryCount: dimensions.filter((dimension) => dimension.nearBoundary).length,
    extendedCode
  };
}
