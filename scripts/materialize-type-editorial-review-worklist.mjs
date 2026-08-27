import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { materializeTypeEditorialCatalog } from './materialize-type-editorial-catalog.mjs';

const readJson = async (relativePath) =>
  JSON.parse(await readFile(path.join(process.cwd(), relativePath), 'utf8'));

export async function materializeTypeEditorialReviewWorklist() {
  const [manifest, reachability, scaffold, namingSystem, primitives, codeSchema, ledger] = await Promise.all([
    readJson('data/type-catalog/v0.1-dev/editorial-catalog-manifest.ja.json'),
    readJson('data/type-catalog/v0.1-dev/reachability.json'),
    readJson('data/type-catalog/v0.1-dev/editorial-scaffold.json'),
    readJson('data/type-catalog/v0.1-dev/display-name-system.ja.json'),
    readJson('data/type-catalog/v0.1-dev/editorial-primitives.ja.json'),
    readJson('data/code-schema/v0.1-dev.json'),
    readJson('data/type-catalog/v0.1-dev/editorial-review-ledger.ja.json')
  ]);

  const catalog = materializeTypeEditorialCatalog({
    manifest,
    reachability,
    scaffold,
    namingSystem,
    primitives,
    codeSchema
  });
  const ledgerByCode = new Map(ledger.entries.map((entry) => [entry.core_code, entry]));
  const axes = [...codeSchema.axes].sort((a, b) => a.position - b.position);

  const entries = catalog.entries.map((entry, index) => {
    const review = ledgerByCode.get(entry.core_code);
    if (!review) throw new Error(`${entry.core_code}: missing review ledger row`);

    return {
      review_order: index + 1,
      type_id: entry.type_id,
      core_code: entry.core_code,
      draft_public_name_ja: entry.public_name_draft_ja,
      formal_draft_title_ja: entry.formal_draft_title_ja,
      code_axes: axes.map((axis, axisIndex) => {
        const symbol = entry.core_code[axisIndex];
        const high = symbol === axis.high_symbol;
        return {
          position: axis.position,
          trait_id: axis.trait_id,
          symbol,
          pole_label_ja: high ? axis.high_label_ja : axis.low_label_ja
        };
      }),
      text_fields: {
        identity_sentence_ja: entry.identity_sentence_ja,
        overview_ja: entry.overview_ja,
        strengths_ja: entry.strengths_ja,
        adversarial_ja: entry.adversarial_ja,
        relationship_love_ja: entry.relationship_love_ja,
        work_ja: entry.work_ja,
        stress_ja: entry.stress_ja,
        growth_guidance_ja: entry.growth_guidance_ja,
        personal_manual_ja: entry.personal_manual_ja
      },
      claim_provenance: entry.claim_provenance,
      neighbor_differentiation: entry.neighbor_differentiation,
      review_state: {
        status: review.status,
        dimensions: review.dimensions,
        reviewer: review.reviewer,
        reviewed_at: review.reviewed_at,
        issue_refs: review.issue_refs,
        notes: review.notes
      },
      reviewer_checklist: [
        'Name is coherent with the naming system and does not add unsupported claims.',
        'Every material sentence is supportable by recorded provenance or an explicit limitation rule.',
        'All six one-axis neighbor notes isolate only the changed Core anchor.',
        'No clinical, moral-ranking, destiny, intelligence, or population-rarity claim is introduced.',
        'Adversarial wording is direct but describes a conditional failure mode rather than an insult or certainty.',
        'Relationship/work/stress copy preserves non-Core Trait limitations.',
        'Japanese wording is natural, internally consistent, and readable at result/social-card constraints.',
        'Final editorial approval is recorded only after all issues are resolved.'
      ]
    };
  });

  return {
    worklist_version: 'type-editorial-review-worklist-ja-v0.1-dev',
    generated_from: {
      editorial_catalog_version: catalog.editorial_catalog_version,
      review_ledger_version: ledger.review_ledger_version,
      code_schema_version: catalog.code_schema_version
    },
    locale: catalog.locale,
    public_use: false,
    entry_count: entries.length,
    approved_count: entries.filter((entry) => entry.review_state.status === 'approved').length,
    changes_required_count: entries.filter((entry) => entry.review_state.status === 'changes-required').length,
    pending_count: entries.filter((entry) => entry.review_state.status === 'pending').length,
    entries
  };
}

async function main() {
  const worklist = await materializeTypeEditorialReviewWorklist();
  const outputArg = process.argv.find((arg) => arg.startsWith('--output='));
  const output = outputArg?.slice('--output='.length) || 'artifacts/editorial-review/type-review-worklist.ja.json';
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(worklist, null, 2) + '\n', 'utf8');
  console.log(`Editorial review worklist written: ${output} (${worklist.entry_count} types; pending=${worklist.pending_count})`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
