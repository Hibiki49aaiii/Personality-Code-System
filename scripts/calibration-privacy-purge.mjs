import fs from 'node:fs';
import process from 'node:process';
import postgres from 'postgres';
import {
  CalibrationOperatorCliError,
  hashCalibrationOperatorCredential,
  safeCliErrorCode
} from './lib/calibration-operator-cli.mjs';
import {
  normalizePurgeReviewRows,
  parseCalibrationPrivacyPurgeArgs
} from './lib/calibration-privacy-purge-cli.mjs';

const policy=JSON.parse(
  fs.readFileSync('data/calibration/privacy-purge-policy-v0.1-dev.json','utf8')
);

function outputJson(stream,value) {
  stream.write(`${JSON.stringify(value)}\n`);
}

function requireDatabaseUrl() {
  const value=process.env[policy.environments.database_url];
  if (typeof value!=='string' || !/^postgres(?:ql)?:\/\//i.test(value)) {
    throw new CalibrationOperatorCliError('PRIVACY_CONTROL_DATABASE_REQUIRED');
  }
  return value;
}

function requireTokenHash() {
  try {
    return hashCalibrationOperatorCredential(
      process.env[policy.environments.operator_token]
    );
  } catch {
    throw new CalibrationOperatorCliError('AUTHENTICATION_FAILED');
  }
}

function openDatabase(databaseUrl) {
  return postgres(databaseUrl,{
    max:1,
    connect_timeout:10,
    idle_timeout:5,
    prepare:true
  });
}

async function requestPurge(args) {
  const sql=openDatabase(requireDatabaseUrl());
  const tokenHash=requireTokenHash();
  try {
    const rows=await sql`
      SELECT public.pcs_request_calibration_privacy_purge(
        ${tokenHash},
        ${args.calibrationRecordId}::uuid
      ) AS purge_request_id
    `;
    if (rows.length!==1 || !rows[0].purge_request_id) {
      throw new CalibrationOperatorCliError('REQUEST_FAILED');
    }
    return {
      ok:true,
      command:'request',
      purgeRequestId:rows[0].purge_request_id,
      status:'requested'
    };
  } catch (error) {
    if (error instanceof CalibrationOperatorCliError) throw error;
    throw new CalibrationOperatorCliError('REQUEST_FAILED');
  } finally {
    await sql.end({timeout:5});
  }
}

async function reviewPurge(args) {
  const sql=openDatabase(requireDatabaseUrl());
  const tokenHash=requireTokenHash();
  try {
    const rows=await sql`
      SELECT *
      FROM public.pcs_review_calibration_privacy_purge(
        ${tokenHash},
        ${args.purgeRequestId}::uuid
      )
    `;
    return {
      ok:true,
      command:'review',
      ...normalizePurgeReviewRows(rows)
    };
  } catch (error) {
    if (error instanceof CalibrationOperatorCliError) throw error;
    throw new CalibrationOperatorCliError('REVIEW_FAILED');
  } finally {
    await sql.end({timeout:5});
  }
}

async function decidePurge(args,decision) {
  const sql=openDatabase(requireDatabaseUrl());
  const tokenHash=requireTokenHash();
  try {
    const rows=await sql`
      SELECT *
      FROM public.pcs_decide_calibration_privacy_purge(
        ${tokenHash},
        ${args.purgeRequestId}::uuid,
        ${decision}
      )
    `;
    if (rows.length!==1) {
      throw new CalibrationOperatorCliError('DECISION_FAILED');
    }
    const row=rows[0];
    return {
      ok:true,
      command:decision==='confirmed'?'confirm':'reject',
      purgeRequestId:row.purge_request_id,
      status:row.status,
      requesterOperatorId:row.requester_operator_id,
      reviewerOperatorId:row.reviewer_operator_id,
      targetCount:Number(row.target_count),
      deletedRecordCount:Number(row.deleted_record_count),
      decidedAt:row.decided_at
    };
  } catch (error) {
    if (error instanceof CalibrationOperatorCliError) throw error;
    throw new CalibrationOperatorCliError('DECISION_FAILED');
  } finally {
    await sql.end({timeout:5});
  }
}

async function main() {
  if (
    policy.privacy_purge_policy_version!=='privacy-purge-policy-v0.1-dev'
    || policy.runtime_api_enabled!==false
    || policy.collection_enabled!==false
    || policy.export_enabled!==false
    || policy.raw_materializer_enabled!==false
    || policy.artifact_purge_supported!==false
  ) {
    throw new CalibrationOperatorCliError('POLICY_STATE_INVALID');
  }

  const args=parseCalibrationPrivacyPurgeArgs(process.argv.slice(2));

  switch (args.command) {
    case 'request':
      return requestPurge(args);
    case 'review':
      return reviewPurge(args);
    case 'confirm':
      return decidePurge(args,'confirmed');
    case 'reject':
      return decidePurge(args,'rejected');
    default:
      throw new CalibrationOperatorCliError('INVALID_COMMAND');
  }
}

try {
  outputJson(process.stdout,await main());
} catch (error) {
  outputJson(process.stderr,{
    ok:false,
    error:safeCliErrorCode(error)
  });
  process.exitCode=1;
}
