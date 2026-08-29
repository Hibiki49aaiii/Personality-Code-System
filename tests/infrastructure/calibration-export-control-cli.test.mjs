import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildFrozenCalibrationExportScope,
  parseCalibrationExportControlArgs,
  validateCalibrationExportPurposeCode,
  validateCalibrationExportRequestId
} from '../../scripts/lib/calibration-export-control-cli.mjs';
import { CalibrationOperatorCliError } from '../../scripts/lib/calibration-operator-cli.mjs';

const wave=JSON.parse(fs.readFileSync('data/calibration/beta-wave-ja-01-draft.json','utf8'));
const freeze=JSON.parse(fs.readFileSync('data/calibration/beta-wave-ja-01-scope-freeze-v0.1-dev.json','utf8'));
const consent=JSON.parse(fs.readFileSync('data/calibration/consent-purpose-v0.1-dev.json','utf8'));
const exportSchema=JSON.parse(fs.readFileSync('data/calibration/export-schema-v0.1-dev.json','utf8'));

test('parses request/review/approve/reject and rejects token/scope argv',()=>{
  assert.deepEqual(
    parseCalibrationExportControlArgs(['request','--purpose-code','wave-primary-analysis']),
    {command:'request',purposeCode:'wave-primary-analysis'}
  );
  assert.deepEqual(
    parseCalibrationExportControlArgs(['review','--request-id','123e4567-e89b-42d3-a456-426614174000']),
    {command:'review',requestId:'123e4567-e89b-42d3-a456-426614174000'}
  );
  assert.deepEqual(
    parseCalibrationExportControlArgs(['approve','--request-id','123e4567-e89b-42d3-a456-426614174000']),
    {command:'approve',requestId:'123e4567-e89b-42d3-a456-426614174000'}
  );
  assert.deepEqual(
    parseCalibrationExportControlArgs(['reject','--request-id','123e4567-e89b-42d3-a456-426614174000']),
    {command:'reject',requestId:'123e4567-e89b-42d3-a456-426614174000'}
  );

  for (const argv of [
    ['request','--purpose-code','wave-primary-analysis','--token','secret'],
    ['request','--purpose-code','wave-primary-analysis','--assessment-model-version','assessment-dev-v999'],
    ['request','--purpose-code','wave-primary-analysis','--wave-id','other-wave']
  ]) {
    assert.throws(
      ()=>parseCalibrationExportControlArgs(argv),
      (error)=>error instanceof CalibrationOperatorCliError
    );
  }
});

test('validates bounded purpose codes and request UUIDs',()=>{
  assert.equal(validateCalibrationExportPurposeCode('wave-primary-analysis'),'wave-primary-analysis');
  assert.equal(
    validateCalibrationExportRequestId('123E4567-E89B-42D3-A456-426614174000'),
    '123e4567-e89b-42d3-a456-426614174000'
  );
  assert.throws(
    ()=>validateCalibrationExportPurposeCode('UPPER CASE'),
    (error)=>error.code==='INVALID_PURPOSE_CODE'
  );
  assert.throws(
    ()=>validateCalibrationExportRequestId('not-a-uuid'),
    (error)=>error.code==='INVALID_REQUEST_ID'
  );
});

test('builds exact repository-frozen Wave JA-01 scope while runtime export stays disabled',()=>{
  assert.deepEqual(
    buildFrozenCalibrationExportScope({wave,freeze,consent,exportSchema}),
    {
      waveId:'beta-ja-wave-01-draft',
      exportSchemaVersion:'calibration-export-record-v0.1-dev',
      consentVersion:'calibration-consent-ja-v0.1-dev',
      assessmentModelVersion:'assessment-dev-v0.3',
      itemBankVersion:'item-bank-v0.2',
      scoringVersion:'scoring-v0.1-dev',
      traitDictionaryVersion:'trait-dictionary-v0.2',
      locale:'ja-JP'
    }
  );
});

test('scope builder fails closed on drift or activation',()=>{
  const activatedWave={...wave,collection_enabled:true};
  assert.throws(
    ()=>buildFrozenCalibrationExportScope({wave:activatedWave,freeze,consent,exportSchema}),
    (error)=>error.code==='RUNTIME_EXPORT_STATE_INVALID'
  );

  const driftedFreeze={
    ...freeze,
    measurement_scope:{...freeze.measurement_scope,assessment_model_version:'assessment-dev-v999'}
  };
  assert.throws(
    ()=>buildFrozenCalibrationExportScope({wave,freeze:driftedFreeze,consent,exportSchema}),
    (error)=>error.code==='FROZEN_SCOPE_INVALID'
  );

  const preregisteredFreeze={...freeze,external_preregistered:true};
  assert.throws(
    ()=>buildFrozenCalibrationExportScope({wave,freeze:preregisteredFreeze,consent,exportSchema}),
    (error)=>error.code==='FROZEN_SCOPE_INVALID'
  );
});
