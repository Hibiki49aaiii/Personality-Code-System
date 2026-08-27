import assert from 'node:assert/strict';
import { materializeTypeEditorialReviewWorklist } from './materialize-type-editorial-review-worklist.mjs';

const worklist = await materializeTypeEditorialReviewWorklist();
assert.equal(worklist.worklist_version, 'type-editorial-review-worklist-ja-v0.1-dev');
assert.equal(worklist.public_use, false);
assert.equal(worklist.entry_count, 64);
assert.equal(worklist.entries.length, 64);
assert.equal(worklist.pending_count + worklist.approved_count + worklist.changes_required_count, 64);

const seen = new Set();
for (const entry of worklist.entries) {
  assert.match(entry.core_code, /^[LS][TV][GA][PE][NF][BD]$/);
  assert.ok(!seen.has(entry.core_code), `${entry.core_code}: duplicate review packet`);
  seen.add(entry.core_code);
  assert.equal(entry.code_axes.length, 6);
  assert.equal(entry.neighbor_differentiation.length, 6);
  assert.equal(entry.reviewer_checklist.length, 8);
  assert.equal(Object.keys(entry.text_fields).length, 9);
  assert.ok(Object.keys(entry.claim_provenance).length >= 9);
  assert.ok(['pending','approved','changes-required'].includes(entry.review_state.status));
  assert.equal(entry.review_order >= 1 && entry.review_order <= 64, true);
}

const order = worklist.entries.map((entry) => entry.review_order);
assert.deepEqual(order, Array.from({ length: 64 }, (_, index) => index + 1));

console.log(`Type editorial review worklist validation passed: 64 complete review packets; pending=${worklist.pending_count}, changes-required=${worklist.changes_required_count}, approved=${worklist.approved_count}. No approval state is synthesized.`);
