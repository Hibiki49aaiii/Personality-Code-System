import { CalibrationOperatorCliError } from './calibration-operator-cli.mjs';

export const CALIBRATION_PRIVACY_PURGE_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const COMMANDS=new Set(['request','review','confirm','reject']);

function takeValue(argv,index,flag) {
  const value=argv[index+1];
  if (typeof value!=='string' || value.length===0 || value.startsWith('--')) {
    throw new CalibrationOperatorCliError(
      `MISSING_VALUE_${flag.slice(2).toUpperCase().replaceAll('-','_')}`
    );
  }
  return value;
}

export function validateCalibrationPrivacyPurgeUuid(value,code='INVALID_UUID') {
  if (typeof value!=='string' || !CALIBRATION_PRIVACY_PURGE_UUID_PATTERN.test(value)) {
    throw new CalibrationOperatorCliError(code);
  }
  return value.toLowerCase();
}

export function parseCalibrationPrivacyPurgeArgs(argv) {
  if (!Array.isArray(argv) || argv.length===0) {
    throw new CalibrationOperatorCliError('COMMAND_REQUIRED');
  }

  const [command,...rest]=argv;
  if (!COMMANDS.has(command)) {
    throw new CalibrationOperatorCliError('INVALID_COMMAND');
  }

  let calibrationRecordId=null;
  let purgeRequestId=null;

  for (let index=0;index<rest.length;index+=1) {
    const arg=rest[index];

    if (arg==='--token' || arg==='--credential' || arg==='--credential-token') {
      throw new CalibrationOperatorCliError('TOKEN_ARGV_FORBIDDEN');
    }

    if (arg==='--calibration-record-id') {
      if (calibrationRecordId!==null) {
        throw new CalibrationOperatorCliError('DUPLICATE_CALIBRATION_RECORD_ID');
      }
      calibrationRecordId=validateCalibrationPrivacyPurgeUuid(
        takeValue(rest,index,arg),
        'INVALID_CALIBRATION_RECORD_ID'
      );
      index+=1;
      continue;
    }

    if (arg==='--purge-request-id') {
      if (purgeRequestId!==null) {
        throw new CalibrationOperatorCliError('DUPLICATE_PURGE_REQUEST_ID');
      }
      purgeRequestId=validateCalibrationPrivacyPurgeUuid(
        takeValue(rest,index,arg),
        'INVALID_PURGE_REQUEST_ID'
      );
      index+=1;
      continue;
    }

    throw new CalibrationOperatorCliError('UNKNOWN_ARGUMENT');
  }

  if (command==='request') {
    if (!calibrationRecordId) {
      throw new CalibrationOperatorCliError('CALIBRATION_RECORD_ID_REQUIRED');
    }
    if (purgeRequestId!==null) {
      throw new CalibrationOperatorCliError('PURGE_REQUEST_ID_NOT_ALLOWED');
    }
    return {command,calibrationRecordId};
  }

  if (!purgeRequestId) {
    throw new CalibrationOperatorCliError('PURGE_REQUEST_ID_REQUIRED');
  }
  if (calibrationRecordId!==null) {
    throw new CalibrationOperatorCliError('CALIBRATION_RECORD_ID_NOT_ALLOWED');
  }

  return {command,purgeRequestId};
}

export function normalizePurgeReviewRows(rows) {
  if (!Array.isArray(rows) || rows.length===0) {
    throw new CalibrationOperatorCliError('PURGE_REQUEST_NOT_FOUND');
  }

  const first=rows[0];
  const expectedCount=Number(first.target_count);
  if (!Number.isInteger(expectedCount) || expectedCount<1 || rows.length!==expectedCount) {
    throw new CalibrationOperatorCliError('PURGE_REQUEST_TARGET_COUNT_INVALID');
  }

  for (const row of rows) {
    if (
      row.purge_request_id!==first.purge_request_id
      || row.status!==first.status
      || row.requester_operator_id!==first.requester_operator_id
      || row.reviewer_operator_id!==first.reviewer_operator_id
      || Number(row.target_count)!==expectedCount
    ) {
      throw new CalibrationOperatorCliError('PURGE_REQUEST_RESULT_INCONSISTENT');
    }
  }

  return {
    purgeRequestId:first.purge_request_id,
    status:first.status,
    requesterOperatorId:first.requester_operator_id,
    reviewerOperatorId:first.reviewer_operator_id ?? null,
    targetCount:expectedCount,
    requestedAt:first.requested_at,
    decidedAt:first.decided_at ?? null,
    targets:rows.map((row)=>({
      calibrationRecordId:row.calibration_record_id,
      qualifyingReason:row.qualifying_reason
    }))
  };
}
