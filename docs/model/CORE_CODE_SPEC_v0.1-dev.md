# Core / Extended Personality Code Specification v0.1-dev

> Status: experimental engineering schema
> Public use: **NO** (`public_use=false`)
> Code schema: `core-code-v0.1-dev` / token `C01D`
> Trait dictionary: v0.2
> Scoring: canonical `score_bp` 0..10000

## 1. Purpose

This document defines a deterministic, machine-parseable identity code so the application can be engineered and tested before beta calibration freezes the public code system.

It deliberately does **not** claim that the six Core Code positions are latent psychological factors. They are direct measured-trait anchors selected for an experimental identity layer.

A future public schema may replace the selected anchors, thresholds, symbols, or number of positions. Such a change creates a new `code_schema_version`; historical codes are not silently reinterpreted.

## 2. Why direct trait anchors

At this stage PCS has conceptual trait boundaries but no beta factor/retest data. Creating composite factors now would add assumptions such as "trait A + trait B are one underlying dimension" before evidence exists.

Therefore v0.1-dev uses six directly measured traits that are:

- conceptually non-identical;
- easy to explain as two legitimate poles;
- spread across major behavioral areas;
- available from the existing 21-trait vector;
- replaceable by a new schema after calibration.

The six positions produce 64 theoretical combinations, but **64 was not used to design the 21-trait measurement model**. The direct Trait Vector remains primary; the code is compression for identity/share UX.

## 3. Core Code positions

Canonical order is fixed by schema position, not alphabetic Trait ID.

| Pos | Trait | High (>=50.00) | Low (<50.00) | Meaning |
| ---: | --- | --- | --- | --- |
| 1 | SYS | `S` 構造志向 | `L` 局所志向 | dependency/system modeling vs local-case handling |
| 2 | VER | `V` 検証重視 | `T` 信頼受容 | higher evidence threshold vs greater acceptance of plausible/trusted information |
| 3 | AUT | `A` 自律志向 | `G` ガイド志向 | self-directed discretion vs comfort with externally coordinated direction |
| 4 | EXE | `E` 早期実行 | `P` 準備優先 | earlier action/iteration vs greater preparation before initiation |
| 5 | NOV | `N` 新奇探索 | `F` 既知深化 | attraction to new domains/change vs familiarity/depth/stability preference |
| 6 | RDP | `D` 深度志向 | `B` 軽量・広がり志向 | concentrated deep relationship investment vs lighter/broader relational style |

Example all-high engineering fixture: `SVAEND`.

Low symbols are not failure labels. For example `T` does not mean gullible, `G` does not mean incapable of independent thought, and `P` does not mean passive.

## 4. Boundary rule

For each axis:

- if `score_bp >= threshold_bp`, choose the high symbol;
- otherwise choose the low symbol;
- v0.1-dev threshold is `5000` for every axis;
- exact `5000` deterministically selects the high symbol;
- there is no random or user-specific tie break.

### Near-boundary metadata

The code remains binary, but confidence in that character is not treated as binary.

v0.1-dev uses `boundary_margin_bp = 500`.

`abs(score_bp - threshold_bp) <= 500` => `nearBoundary=true`.

Thus a score of 50.00 and a score of 95.00 may produce the same letter but are represented differently in structured result metadata.

The public UI may later display a strength/bar/borderline explanation, but it must not alter the canonical character.

## 5. Why these six are still provisional

Before a public code schema freeze, beta evidence must review:

- test-retest stability of each proposed core anchor;
- response distribution / floor-ceiling behavior;
- whether the 50.00 cut produces pathological imbalance;
- whether near-boundary users frequently flip on retest;
- conceptual redundancy after empirical factor/correlation review;
- user comprehension of both poles without value judgment;
- whether another retained Trait provides materially better identity coverage.

Failure on these criteria requires a new code schema rather than retroactively changing `C01D`.

## 6. Extended Code

Core Code intentionally discards detail. Extended Code preserves the entire 21-trait profile as five deterministic score bands.

Canonical format version: `PCSX1`.

Grammar:

`PCSX1~<schema_token>~<core_code>~<TRAIT><band>.<TRAIT><band>...`

Canonical Trait order:

`SYS VER ADV ABS META EMO COG BND RDP REC CON AUT EXE OPT FIN NOV PER RSK UNC STR CRE`

Example shape:

`PCSX1~C01D~SVAEND~SYS5.VER4.ADV4.ABS5.META5.EMO3.COG4.BND5.RDP5.REC4.CON4.AUT5.EXE5.OPT5.FIN2.NOV5.PER3.RSK4.UNC2.STR4.CRE5`

The string is an interchange/identity representation, not the stored source of truth. Stored canonical Trait Scores remain `score_bp`.

## 7. Trait band mapping

v0.1-dev band boundaries:

| Band | score_bp | Human range |
| ---: | ---: | ---: |
| 1 | 0..1999 | 0.00–19.99 |
| 2 | 2000..3999 | 20.00–39.99 |
| 3 | 4000..5999 | 40.00–59.99 |
| 4 | 6000..7999 | 60.00–79.99 |
| 5 | 8000..10000 | 80.00–100.00 |

Boundary assignment is deterministic: a boundary value belongs to the higher band (`2000 -> 2`, `4000 -> 3`, etc.).

## 8. Version contract

Every result using this schema must retain at least:

- assessment/scoring model version;
- Trait Scores;
- `code_schema_version`;
- schema token;
- Core Code;
- per-axis selected pole and distance from threshold;
- Extended Code or sufficient structured data to reproduce it.

Changing any of the following creates a new code schema version:

- axis membership/order;
- threshold;
- symbol;
- tie rule;
- boundary margin if displayed interpretation depends on it;
- Extended Code band boundaries/order/grammar.

Changing only a human-readable Core Type name does not change code semantics, but does create a content/catalog version if published copy changes.

## 9. Determinism requirements

Given identical Trait Scores and identical code schema:

- Core Code must be byte-for-byte identical;
- dimension order must be identical;
- near-boundary flags must be identical;
- Extended Code must be byte-for-byte identical;
- input Trait Score ordering must not affect output;
- missing/duplicate/invalid scores must fail rather than silently default.

## 10. What remains before public freeze

`C01D` exists to make engineering testable. It is not yet the advertised final Personality Code System.

Before `public_use=true` for any schema:

1. complete beta item calibration;
2. verify proposed anchor stability/distribution;
3. review symbol naming in Japanese/English;
4. freeze thresholds under a new non-dev code schema if needed;
5. create the reachable Core Type catalog and dedicated illustration mapping;
6. run result contradiction/content coverage tests.
