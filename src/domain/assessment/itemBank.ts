import {
  TRAIT_IDS,
  type ItemDirection,
  type ScoringItem,
  type TraitId
} from './scoring';

export interface CandidateItemRecord {
  id: string;
  revision: string;
  locale: string;
  primary_trait: string;
  direction: ItemDirection;
  weight: number;
  status: string;
  text: string;
  rationale: string;
  discriminates: string[];
  introduced: string;
}

function isTraitId(value: string): value is TraitId {
  return (TRAIT_IDS as readonly string[]).includes(value);
}

export function toScoringItem(record: CandidateItemRecord): ScoringItem {
  if (!isTraitId(record.primary_trait)) {
    throw new Error(`Unknown trait on ${record.id}: ${record.primary_trait}`);
  }
  if (record.direction !== 1 && record.direction !== -1) {
    throw new Error(`Invalid direction on ${record.id}`);
  }
  if (!Number.isFinite(record.weight) || record.weight <= 0) {
    throw new Error(`Invalid weight on ${record.id}`);
  }

  const weightMilli = record.weight * 1000;
  if (!Number.isSafeInteger(weightMilli)) {
    throw new Error(`Weight on ${record.id} is not representable in weightMilli units`);
  }

  return {
    id: record.id,
    traitId: record.primary_trait,
    direction: record.direction,
    weightMilli,
    required: true
  };
}
