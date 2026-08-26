# PCS Type Display Name System — v0.1-dev

Status: **development editorial system / `public_use=false`**

This document defines the human-readable display-name layer for the current development Core Code schema `C01D`. It does **not** approve the names for public launch and does not change the psychometric meaning of any code.

## 1. Purpose

The six-letter Core Code is the stable diagnostic identifier. A display name is a secondary recognition layer for result pages, social cards, illustrations, and conversation.

The display-name system must satisfy all of the following simultaneously:

- every reachable C01D code gets a deterministic name;
- all 64 names are distinguishable;
- a name can be traced back to the six Core dimensions;
- the naming layer adds no unsupported psychological claims;
- neighboring codes remain visibly distinguishable;
- names are short enough for mobile/result/share-card use;
- names do not imply intelligence, superiority, rarity, diagnosis, or success probability.

## 2. Grammar

Canonical development pattern:

`{ACTION}の{ROLE}〈{RELATIONSHIP}〉`

Example:

`SVAEND` → **開拓の探究設計家〈深縁〉**

The three visible parts are not independent marketing inventions. They map directly to code segments:

- positions 1–3 → cognitive/governance **ROLE**;
- positions 4–5 → action/exploration **ACTION**;
- position 6 → relationship-investment **RELATIONSHIP**.

The authoritative machine-readable vocabulary is `data/type-catalog/v0.1-dev/display-name-system.ja.json`.

## 3. Role vocabulary — positions 1–3

| Code | Draft role | Intended distinction |
|---|---|---|
| `LTG` | 調律師 | concrete + trusted premise + shared framework |
| `LTA` | 実務家 | concrete + trusted premise + autonomous execution |
| `LVG` | 監査士 | concrete + verification + shared framework |
| `LVA` | 独立検証者 | concrete + verification + autonomy |
| `STG` | 編成家 | systems + trusted premise + shared framework |
| `STA` | 構築家 | systems + trusted premise + autonomy |
| `SVG` | 検証設計家 | systems + verification + shared framework |
| `SVA` | 探究設計家 | systems + verification + autonomy |

These are editorial labels, not professions, credentials, or ability rankings.

## 4. Action vocabulary — positions 4–5

| Code | Draft action | Meaning boundary |
|---|---|---|
| `PF` | 深化 | prepare + deepen familiar territory |
| `PN` | 構想 | prepare + explore novel options |
| `EF` | 実践 | execute + deepen familiar territory |
| `EN` | 開拓 | execute + explore novel territory |

The action term describes approach tendency only. It does not imply productivity, courage, creativity, or competence beyond measured dimensions.

## 5. Relationship badge — position 6

| Code | Draft badge | Meaning boundary |
|---|---|---|
| `B` | 広縁 | relational investment distributed across wider connections |
| `D` | 深縁 | relational investment concentrated into fewer deeper relationships |

`広縁` and `深縁` are not extroversion/introversion labels and must not be described as social skill levels.

## 6. Identity sentence

Each display name is accompanied by one deterministic short identity sentence generated from the same three code components. The identity sentence exists to explain the name, not to replace the full 21-Trait + Interaction result.

A type-level identity sentence MUST NOT contradict a more specific Trait-band or Interaction module. When the detailed result differs from the compressed Core summary, the detailed result has interpretive priority.

## 7. Differentiation rule

For every Core Code, all six Hamming-distance-1 neighbors must have:

- a different display name;
- a different identity sentence;
- a visible lexical difference attributable to the changed Core dimension.

CI recomputes this requirement over all 64 codes.

## 8. Prohibited naming behavior

Names and identity sentences must not use unsupported prestige or pathology framing. Current automated prohibited terms include:

- 天才
- 最強
- 希少
- 選ばれた
- 成功者
- 高知能
- 異常

The prohibited list is not exhaustive; editorial review may reject additional wording.

## 9. Versioning

The development naming system is versioned independently from the Core Code schema. Changing any role/action/relationship label or identity clause requires a new display-name-system version once a version has been used by a frozen content release.

A result or share card must never resolve a mutable "latest name". Final runtime integration must bind the display name to an exact content/catalog version so historical results remain reproducible.

## 10. Promotion gate

Before any display name becomes a public production name:

- [ ] Japanese editorial review is complete;
- [ ] all 64 names are reviewed side-by-side for awkward repetition and unintended connotations;
- [ ] one-axis neighbor distinctions are human-reviewed in addition to CI checks;
- [ ] names are tested at mobile/result/OG-card sizes;
- [ ] names are reviewed together with illustration motifs;
- [ ] the Phase 5C public Core schema is frozen or the catalog is migrated to it;
- [ ] the production catalog version is immutable.

Until those gates pass, generated names remain **draft display names**, even when they are rendered in a development environment.
