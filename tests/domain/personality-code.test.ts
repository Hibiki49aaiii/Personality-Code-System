import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { TRAIT_IDS, type TraitId, type TraitScore } from '../../src/domain/assessment/scoring';
import {
  generatePersonalityCode,
  PersonalityCodeError,
  traitBandFromScoreBp,
  type CoreCodeSchema
} from '../../src/domain/assessment/personalityCode';

function loadSchema(): CoreCodeSchema {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), 'data', 'code-schema', 'v0.1-dev.json'), 'utf8')
  ) as CoreCodeSchema;
}

function makeScores(overrides: Partial<Record<TraitId, number>> = {}): TraitScore[] {
  return TRAIT_IDS.map((traitId) => {
    const scoreBp = overrides[traitId] ?? 5000;
    return {
      traitId,
      keyedPointsWeighted: scoreBp,
      maxPointsWeighted: 10000,
      scoreBp,
      score: scoreBp / 100,
      displayScore: Math.floor((scoreBp + 50) / 100),
      answeredItems: 7
    };
  });
}

test('exact midpoint uses documented high-side tie rule', () => {
  const result = generatePersonalityCode(makeScores(), loadSchema());
  assert.equal(result.coreCode, 'SVAEND');
  assert.equal(result.nearBoundaryCount, 6);
  assert.ok(result.extendedCode.startsWith('PCSX1~C01D~SVAEND~'));
  assert.match(result.extendedCode, /SYS3\.VER3\.ADV3/);
});

test('all six core anchors just below threshold select low symbols', () => {
  const result = generatePersonalityCode(
    makeScores({ SYS: 4999, VER: 4999, AUT: 4999, EXE: 4999, NOV: 4999, RDP: 4999 }),
    loadSchema()
  );
  assert.equal(result.coreCode, 'LTGPFB');
  assert.equal(result.nearBoundaryCount, 6);
  for (const dimension of result.dimensions) assert.equal(dimension.pole, 'low');
});

test('far-from-boundary dimensions are not marked near boundary', () => {
  const result = generatePersonalityCode(
    makeScores({ SYS: 9000, VER: 1000, AUT: 8000, EXE: 2000, NOV: 7500, RDP: 2500 }),
    loadSchema()
  );
  assert.equal(result.coreCode, 'STAPNB');
  assert.equal(result.nearBoundaryCount, 0);
});

test('trait band boundaries are exact and deterministic', () => {
  assert.equal(traitBandFromScoreBp(0), 1);
  assert.equal(traitBandFromScoreBp(1999), 1);
  assert.equal(traitBandFromScoreBp(2000), 2);
  assert.equal(traitBandFromScoreBp(3999), 2);
  assert.equal(traitBandFromScoreBp(4000), 3);
  assert.equal(traitBandFromScoreBp(5999), 3);
  assert.equal(traitBandFromScoreBp(6000), 4);
  assert.equal(traitBandFromScoreBp(7999), 4);
  assert.equal(traitBandFromScoreBp(8000), 5);
  assert.equal(traitBandFromScoreBp(10000), 5);
});

test('trait input ordering does not affect Core or Extended Code', () => {
  const schema = loadSchema();
  const scores = makeScores({ SYS: 8200, VER: 3100, AUT: 7200, EXE: 4800, NOV: 9100, RDP: 2200, ADV: 7700 });
  const forward = generatePersonalityCode(scores, schema);
  const reverse = generatePersonalityCode([...scores].reverse(), schema);
  assert.deepEqual(reverse, forward);
});

test('missing non-core trait is rejected because Extended Code requires all retained traits', () => {
  const scores = makeScores().filter((score) => score.traitId !== 'ADV');
  assert.throws(
    () => generatePersonalityCode(scores, loadSchema()),
    (error: unknown) => error instanceof PersonalityCodeError && error.code === 'MISSING_TRAIT_SCORE'
  );
});

test('duplicate trait score is rejected', () => {
  const scores = makeScores();
  scores.push({ ...scores[0] });
  assert.throws(
    () => generatePersonalityCode(scores, loadSchema()),
    (error: unknown) => error instanceof PersonalityCodeError && error.code === 'DUPLICATE_TRAIT_SCORE'
  );
});
