import type { CandidateItemRecord } from './itemBank';

export type ReviewDisposition = 'accept-r1' | 'revise-r2' | 'hold-for-beta';

export interface ReviewReasonEntry {
  id: string;
  reason_codes: string[];
  note?: string;
}

export interface RevisionEntry extends ReviewReasonEntry {
  revision: string;
  text: string;
}

export interface ItemReviewLedger {
  reviewed_in: string;
  source_version: string;
  accepted_by_trait: Record<string, string[]>;
  hold_for_beta: ReviewReasonEntry[];
  revisions: RevisionEntry[];
}

export interface ReviewedCandidateItemRecord extends CandidateItemRecord {
  review_disposition: ReviewDisposition;
  reviewed_in: string;
  review_reason_codes?: string[];
  review_note?: string;
}

export class ItemReviewError extends Error {
  constructor(
    public readonly code:
      | 'DUPLICATE_BASE_ID'
      | 'UNKNOWN_REVIEW_ID'
      | 'DUPLICATE_REVIEW_DISPOSITION'
      | 'MISSING_REVIEW_DISPOSITION'
      | 'INVALID_REVISION'
      | 'TRAIT_BUCKET_MISMATCH',
    message: string
  ) {
    super(message);
    this.name = 'ItemReviewError';
  }
}

export function materializeReviewedItemBank(
  baseItems: CandidateItemRecord[],
  ledger: ItemReviewLedger
): ReviewedCandidateItemRecord[] {
  const baseById = new Map<string, CandidateItemRecord>();
  for (const item of baseItems) {
    if (baseById.has(item.id)) {
      throw new ItemReviewError('DUPLICATE_BASE_ID', `Duplicate base item ${item.id}`);
    }
    baseById.set(item.id, item);
  }

  const dispositionById = new Map<string, ReviewDisposition>();
  const metaById = new Map<string, ReviewReasonEntry | RevisionEntry>();

  const assign = (
    id: string,
    disposition: ReviewDisposition,
    meta?: ReviewReasonEntry | RevisionEntry,
    expectedTrait?: string
  ) => {
    const base = baseById.get(id);
    if (!base) {
      throw new ItemReviewError('UNKNOWN_REVIEW_ID', `Unknown review item ${id}`);
    }
    if (expectedTrait && base.primary_trait !== expectedTrait) {
      throw new ItemReviewError(
        'TRAIT_BUCKET_MISMATCH',
        `${id} belongs to ${base.primary_trait}, not ${expectedTrait}`
      );
    }
    if (dispositionById.has(id)) {
      throw new ItemReviewError(
        'DUPLICATE_REVIEW_DISPOSITION',
        `${id} has multiple review dispositions`
      );
    }
    dispositionById.set(id, disposition);
    if (meta) metaById.set(id, meta);
  };

  for (const [trait, ids] of Object.entries(ledger.accepted_by_trait)) {
    for (const id of ids) assign(id, 'accept-r1', undefined, trait);
  }
  for (const entry of ledger.hold_for_beta) {
    assign(entry.id, 'hold-for-beta', entry);
  }
  for (const entry of ledger.revisions) {
    if (entry.revision !== 'r2' || entry.text.trim().length < 12) {
      throw new ItemReviewError('INVALID_REVISION', `Invalid r2 revision for ${entry.id}`);
    }
    assign(entry.id, 'revise-r2', entry);
  }

  for (const item of baseItems) {
    if (!dispositionById.has(item.id)) {
      throw new ItemReviewError(
        'MISSING_REVIEW_DISPOSITION',
        `Missing review disposition for ${item.id}`
      );
    }
  }

  return baseItems.map((base) => {
    const disposition = dispositionById.get(base.id)!;
    const meta = metaById.get(base.id);
    const reviewed: ReviewedCandidateItemRecord = {
      ...base,
      status: 'reviewed',
      review_disposition: disposition,
      reviewed_in: ledger.reviewed_in
    };

    if (disposition === 'revise-r2') {
      const revision = meta as RevisionEntry;
      reviewed.revision = revision.revision;
      reviewed.text = revision.text;
    }
    if (meta?.reason_codes?.length) reviewed.review_reason_codes = [...meta.reason_codes];
    if (meta?.note) reviewed.review_note = meta.note;

    return reviewed;
  });
}
