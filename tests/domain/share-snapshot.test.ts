import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSanitizedShareSnapshot,
  SHARE_SNAPSHOT_SCHEMA_VERSION
} from '../../src/domain/sharing/shareSnapshot';
import type { ResultSnapshotV01 } from '../../src/domain/assessment/resultSnapshot';

function privateSnapshot(): ResultSnapshotV01 {
  return {
    snapshotSchemaVersion: 'result-snapshot-v0.1-dev',
    versions: {
      resultSchemaVersion: 'structured-result-v0.1-dev',
      assessmentModelVersion: 'assessment-dev-v0.3',
      itemBankVersion: 'item-bank-v0.2',
      scoringVersion: 'scoring-v0.1-dev',
      codeSchemaVersion: 'core-code-v0.1-dev',
      interactionVersion: 'trait-interactions-v0.1',
      contentVersion: 'content-dev-v0.3'
    },
    locale: 'ja-JP',
    traitScores: [{ traitId: 'SYS', scoreBp: 5000 }],
    responseQuality: {
      answerCount: 147,
      valueCounts: { 1: 0, 2: 0, 3: 147, 4: 0, 5: 0 },
      dominantResponseShareBp: 10000,
      extremeResponseShareBp: 0,
      flags: ['all_midpoint_responses']
    },
    personalityCode: {
      codeSchemaVersion: 'core-code-v0.1-dev',
      schemaToken: 'C01D',
      coreCode: 'SVAEND',
      dimensions: [],
      nearBoundaryCount: 6,
      extendedCode: 'PCSX1~private-detail'
    },
    interactionActiveIds: ['PCS-INT-001'],
    content: {
      selectedIds: ['DEV-TYPE-SVAEND-IDENTITY'],
      suppressed: []
    },
    sections: [{ domain: 'core-identity', moduleIds: ['DEV-TYPE-SVAEND-IDENTITY'] }]
  };
}

test('sanitized share snapshot exports only explicitly allowed result identity fields', () => {
  const share = createSanitizedShareSnapshot(privateSnapshot(), {
    displayName: null,
    identitySentence: null,
    illustrationAssetVersion: null
  });

  assert.equal(share.shareSchemaVersion, SHARE_SNAPSHOT_SCHEMA_VERSION);
  assert.equal(share.coreCode, 'SVAEND');
  assert.equal(share.versions.assessmentModelVersion, 'assessment-dev-v0.3');
  assert.equal(share.versions.codeSchemaVersion, 'core-code-v0.1-dev');
  assert.equal(share.versions.contentVersion, 'content-dev-v0.3');

  const serialized = JSON.stringify(share);
  for (const forbidden of [
    'traitScores',
    'responseQuality',
    'interactionActiveIds',
    'extendedCode',
    'selectedIds',
    'sections',
    'answers',
    'sessionToken',
    'sessionId'
  ]) {
    assert.equal(serialized.includes(forbidden), false, `share snapshot leaked ${forbidden}`);
  }

  assert.deepEqual(Object.keys(share).sort(), [
    'coreCode',
    'locale',
    'presentation',
    'shareSchemaVersion',
    'sourceResultSnapshotSchemaVersion',
    'versions'
  ]);
});
