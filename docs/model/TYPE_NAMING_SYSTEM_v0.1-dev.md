# TYPE_NAMING_SYSTEM_v0.1-dev

> Status: Phase 3A development naming grammar
> Catalog: `type-catalog-v0.1-dev`
> Code schema: `core-code-v0.1-dev` / `C01D`
> Public use: **false**

## Purpose

Give all 64 reachable C01D development types a coherent, deterministic **structural title** before human-facing short public names are authored.

The structural title is an editorial locator, not the final brand/type name. Its job is to make every word traceable to the six Core Code positions and make one-axis neighbors visibly comparable.

## Why a grammar is required

Writing 64 unrelated names independently creates predictable failures:

- two one-axis neighbors can receive wildly different stereotypes;
- the same word can imply different Trait evidence in different entries;
- attractive names drift toward praise while adversarial names drift toward insult;
- future public-schema changes become difficult to migrate;
- editors cannot explain why a type received a particular label.

Therefore C01D draft naming uses three compositional layers that cover all six axes exactly once.

## Structural title grammar

`<relation-mode>・<action-exploration-mode>型 <cognitive-governance-archetype>`

Example:

`SVAEND -> 深度・開拓実行型 自律検証設計者`

The title components are deliberately descriptive rather than literary. A later `public_name_ja` may be shorter/more memorable, but it must remain semantically compatible with this structural title and its provenance.

## Layer A — cognitive/governance archetype

Uses Core positions 1–3 exactly once:

1. SYS `S/L`
2. VER `V/T`
3. AUT `A/G`

| Prefix | Structural archetype | Meaning boundary |
| --- | --- | --- |
| LTG | 協調実務者 | local/direct processing + pragmatic trust acceptance + comfort with external/shared direction |
| LTA | 自律実務者 | local/direct processing + pragmatic trust acceptance + high self-direction |
| LVG | 検証運用者 | local/direct processing + evidence verification + comfort with external/shared direction |
| LVA | 独立検証者 | local/direct processing + evidence verification + high self-direction |
| STG | 協調設計者 | systems modeling + pragmatic trust acceptance + comfort with external/shared direction |
| STA | 自律設計者 | systems modeling + pragmatic trust acceptance + high self-direction |
| SVG | 検証設計者 | systems modeling + evidence verification + comfort with external/shared direction |
| SVA | 自律検証設計者 | systems modeling + evidence verification + high self-direction |

These labels do not imply intelligence, occupation, authority rank, or competence. “設計者” means a structural/modeling orientation in this development grammar, not professional design credentials.

## Layer B — action/exploration mode

Uses Core positions 4–5 exactly once:

4. EXE `E/P`
5. NOV `N/F`

| Pair | Structural mode | Interpretation boundary |
| --- | --- | --- |
| PF | 準備深化 | slower/more preparatory initiation + preference for familiar depth/refinement |
| PN | 探索構想 | slower/more preparatory initiation + attraction to new/unfamiliar possibilities |
| EF | 実行深化 | faster initiation + preference for familiar depth/refinement |
| EN | 開拓実行 | faster initiation + attraction to new/unfamiliar possibilities |

The mode does not infer persistence, finishing discipline, risk appetite, creativity, or uncertainty tolerance. Those remain separate measured Traits in the 21-Trait profile.

## Layer C — relationship mode

Uses Core position 6 exactly once:

6. RDP `D/B`

| Symbol | Structural relation mode | Interpretation boundary |
| --- | --- | --- |
| B | 広がり | wider/lighter relational investment style |
| D | 深度 | concentrated/deeper relational investment style |

This component does not imply introversion/extraversion, attachment security, loyalty, social skill, dependency, or relationship quality.

## Provenance order

Every structural title entry stores all six provenance atoms in canonical axis order:

`core-axis:1:*` through `core-axis:6:*`.

A validator must prove that:

- the six atoms match the six characters of `core_code`;
- no axis is missing or duplicated;
- the stored title parts match the grammar tables;
- all 64 structural titles are unique;
- every reachability code has exactly one scaffold entry.

## Public-name layer

`formal_draft_title_ja` and future `public_name_ja` are separate fields.

A future public name MAY be more memorable, e.g. a compact archetype phrase, but it MUST:

- preserve the semantic direction of the structural title;
- not introduce unsupported Traits;
- not rank one pole as superior;
- remain distinguishable from one-axis neighbors;
- avoid medical, mystical, destiny, or intelligence claims;
- carry an editorial rationale and provenance review;
- remain versioned independently from the scoring semantics.

Public names are deliberately left `null` in the first editorial scaffold. This prevents a mechanically generated label from accidentally being treated as approved product copy.

## One-axis neighbor review

When public names and identity sentences are authored, each entry must be reviewed against its six Hamming-distance-1 neighbors.

For a one-axis neighbor pair:

- five Core-axis implications should remain stable;
- only the changed axis may justify the headline difference;
- detailed 21-Trait/interaction content may still differentiate same-code users and must not be overwritten by the Core title.

## Naming QA

Before the development naming layer can be called editorially complete:

- [x] deterministic structural grammar exists;
- [x] every C01D axis is represented once in the grammar;
- [ ] 64 human-facing `public_name_ja` drafts authored;
- [ ] names reviewed for duplicate/near-duplicate meaning;
- [ ] six-neighbor differentiation review completed per entry;
- [ ] Japanese tone/length/readability pass completed;
- [ ] prohibited superiority/clinical/mystical implications reviewed;
- [ ] names reconciled against the eventual `public_use=true` schema before publication.

## Version impact

Changing only an approved display name creates a new catalog/content revision, not a scoring change.

Changing which code symbols/axes feed a title is a schema/catalog compatibility change and must not silently reuse `type-catalog-v0.1-dev`.
