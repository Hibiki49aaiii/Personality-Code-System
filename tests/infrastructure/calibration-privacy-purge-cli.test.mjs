import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePurgeReviewRows,
  parseCalibrationPrivacyPurgeArgs,
  validateCalibrationPrivacyPurgeUuid
} from '../../scripts/lib/calibration-privacy-purge-cli.mjs';
import { CalibrationOperatorCliError } from '../../scripts/lib/calibration-operator-cli.mjs';

test('parses request/review/confirm/reject commands',()=>{
  assert.deepEqual(
    parseCalibrationPrivacyPurgeArgs([
      'request',
      '--calibration-record-id','123e4567-e89b-42d3-a456-426614174000'
    ]),
    {
      command:'request',
      calibrationRecordId:'123e4567-e89b-42d3-a456-426614174000'
    }
  );

  for (const command of ['review','confirm','reject']) {
    assert.deepEqual(
      parseCalibrationPrivacyPurgeArgs([
        command,
        '--purge-request-id','123e4567-e89b-42d3-a456-426614174000'
      ]),
      {
        command,
        purgeRequestId:'123e4567-e89b-42d3-a456-426614174000'
      }
    );
  }
});

test('forbids raw operator token argv and wrong identifiers',()=>{
  assert.throws(
    ()=>parseCalibrationPrivacyPurgeArgs([
      'request',
      '--calibration-record-id','123e4567-e89b-42d3-a456-426614174000',
      '--token','secret'
    ]),
    (error)=>error instanceof CalibrationOperatorCliError && error.code==='TOKEN_ARGV_FORBIDDEN'
  );

  assert.throws(
    ()=>parseCalibrationPrivacyPurgeArgs([
      'request',
      '--calibration-record-id','not-a-uuid'
    ]),
    (error)=>error instanceof CalibrationOperatorCliError && error.code==='INVALID_CALIBRATION_RECORD_ID'
  );

  assert.throws(
    ()=>parseCalibrationPrivacyPurgeArgs([
      'confirm',
      '--purge-request-id','not-a-uuid'
    ]),
    (error)=>error instanceof CalibrationOperatorCliError && error.code==='INVALID_PURGE_REQUEST_ID'
  );
});

test('normalizes bounded multi-target review rows',()=>{
  const rows=[
    {
      purge_request_id:'123e4567-e89b-42d3-a456-426614174000',
      status:'requested',
      requester_operator_id:'123e4567-e89b-42d3-a456-426614174001',
      reviewer_operator_id:null,
      target_count:2,
      requested_at:'2026-08-31T00:00:00.000Z',
      decided_at:null,
      calibration_record_id:'123e4567-e89b-42d3-a456-426614174010',
      qualifying_reason:'consent-withdrawn'
    },
    {
      purge_request_id:'123e4567-e89b-42d3-a456-426614174000',
      status:'requested',
      requester_operator_id:'123e4567-e89b-42d3-a456-426614174001',
      reviewer_operator_id:null,
      target_count:2,
      requested_at:'2026-08-31T00:00:00.000Z',
      decided_at:null,
      calibration_record_id:'123e4567-e89b-42d3-a456-426614174011',
      qualifying_reason:'retest-pair-invalidated'
    }
  ];

  assert.deepEqual(normalizePurgeReviewRows(rows),{
    purgeRequestId:'123e4567-e89b-42d3-a456-426614174000',
    status:'requested',
    requesterOperatorId:'123e4567-e89b-42d3-a456-426614174001',
    reviewerOperatorId:null,
    targetCount:2,
    requestedAt:'2026-08-31T00:00:00.000Z',
    decidedAt:null,
    targets:[
      {
        calibrationRecordId:'123e4567-e89b-42d3-a456-426614174010',
        qualifyingReason:'consent-withdrawn'
      },
      {
        calibrationRecordId:'123e4567-e89b-42d3-a456-426614174011',
        qualifyingReason:'retest-pair-invalidated'
      }
    ]
  });
});

test('review normalization fails closed on count or row inconsistency',()=>{
  assert.throws(
    ()=>normalizePurgeReviewRows([]),
    (error)=>error.code==='PURGE_REQUEST_NOT_FOUND'
  );

  assert.throws(
    ()=>normalizePurgeReviewRows([{
      purge_request_id:'123e4567-e89b-42d3-a456-426614174000',
      status:'requested',
      requester_operator_id:'123e4567-e89b-42d3-a456-426614174001',
      reviewer_operator_id:null,
      target_count:2,
      requested_at:'2026-08-31T00:00:00.000Z',
      decided_at:null,
      calibration_record_id:'123e4567-e89b-42d3-a456-426614174010',
      qualifying_reason:'consent-withdrawn'
    }]),
    (error)=>error.code==='PURGE_REQUEST_TARGET_COUNT_INVALID'
  );
});

test('validates UUID values canonically',()=>{
  assert.equal(
    validateCalibrationPrivacyPurgeUuid('123E4567-E89B-42D3-A456-426614174000'),
    '123e4567-e89b-42d3-a456-426614174000'
  );
});
