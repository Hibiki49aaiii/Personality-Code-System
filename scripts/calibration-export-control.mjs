import fs from 'node:fs';
import process from 'node:process';
import postgres from 'postgres';
import {
  CalibrationOperatorCliError,
  hashCalibrationOperatorCredential,
  safeCliErrorCode
} from './lib/calibration-operator-cli.mjs';
import {
  buildFrozenCalibrationExportScope,
  parseCalibrationExportControlArgs
} from './lib/calibration-export-control-cli.mjs';

const policy=JSON.parse(
  fs.readFileSync('data/calibration/export-control-policy-v0.1-dev.json','utf8')
);
const wave=JSON.parse(fs.readFileSync(policy.scope_sources.wave,'utf8'));
const freeze=JSON.parse(fs.readFileSync(policy.scope_sources.freeze,'utf8'));
const consent=JSON.parse(fs.readFileSync(policy.scope_sources.consent,'utf8'));
const exportSchema=JSON.parse(fs.readFileSync(policy.scope_sources.export_schema,'utf8'));

function outputJson(stream,value) {
  stream.write(`${JSON.stringify(value)}\n`);
}

function requireDatabaseUrl() {
  const value=process.env[policy.environments.database_url];
  if (typeof value!=='string' || !/^postgres(?:ql)?:\/\//i.test(value)) {
    throw new CalibrationOperatorCliError('CONTROL_DATABASE_REQUIRED');
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

function scopeForOutput(row) {
  return {
    requestId:row.request_id,
    status:row.status,
    requesterOperatorId:row.requester_operator_id,
    approverOperatorId:row.approver_operator_id ?? null,
    purposeCode:row.purpose_code,
    waveId:row.wave_id,
    exportSchemaVersion:row.export_schema_version,
    consentVersion:row.consent_version,
    assessmentModelVersion:row.assessment_model_version,
    itemBankVersion:row.item_bank_version,
    scoringVersion:row.scoring_version,
    traitDictionaryVersion:row.trait_dictionary_version,
    locale:row.locale,
    requestedAt:row.requested_at,
    decidedAt:row.decided_at ?? null
  };
}

async function requestExport(args) {
  const scope=buildFrozenCalibrationExportScope({wave,freeze,consent,exportSchema});
  const tokenHash=requireTokenHash();
  const sql=openDatabase(requireDatabaseUrl());
  try {
    const rows=await sql`
      SELECT public.pcs_request_calibration_export(
        ${tokenHash},
        ${args.purposeCode},
        ${scope.waveId},
        ${scope.exportSchemaVersion},
        ${scope.consentVersion},
        ${scope.assessmentModelVersion},
        ${scope.itemBankVersion},
        ${scope.scoringVersion},
        ${scope.traitDictionaryVersion},
        ${scope.locale}
      ) AS request_id
    `;
    if (rows.length!==1 || !rows[0].request_id) {
      throw new CalibrationOperatorCliError('REQUEST_FAILED');
    }
    return {
      ok:true,
      command:'request',
      requestId:rows[0].request_id,
      status:'requested',
      purposeCode:args.purposeCode,
      scope
    };
  } catch (error) {
    if (error instanceof CalibrationOperatorCliError) throw error;
    throw new CalibrationOperatorCliError('REQUEST_FAILED');
  } finally {
    await sql.end({timeout:5});
  }
}

async function reviewRequest(args) {
  const tokenHash=requireTokenHash();
  const sql=openDatabase(requireDatabaseUrl());
  try {
    const rows=await sql`
      SELECT *
      FROM public.pcs_review_calibration_export_request(
        ${tokenHash},
        ${args.requestId}::uuid
      )
    `;
    if (rows.length!==1) {
      throw new CalibrationOperatorCliError('REQUEST_NOT_FOUND');
    }
    return {
      ok:true,
      command:'review',
      ...scopeForOutput(rows[0])
    };
  } catch (error) {
    if (error instanceof CalibrationOperatorCliError) throw error;
    throw new CalibrationOperatorCliError('REVIEW_FAILED');
  } finally {
    await sql.end({timeout:5});
  }
}

async function decideRequest(args,decision) {
  const tokenHash=requireTokenHash();
  const sql=openDatabase(requireDatabaseUrl());
  try {
    const rows=await sql`
      SELECT *
      FROM public.pcs_decide_calibration_export_request(
        ${tokenHash},
        ${args.requestId}::uuid,
        ${decision}
      )
    `;
    if (rows.length!==1) {
      throw new CalibrationOperatorCliError('DECISION_FAILED');
    }
    return {
      ok:true,
      command:decision==='approved'?'approve':'reject',
      requestId:rows[0].request_id,
      status:rows[0].status,
      requesterOperatorId:rows[0].requester_operator_id,
      approverOperatorId:rows[0].approver_operator_id,
      decidedAt:rows[0].decided_at
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
    policy.export_control_policy_version!=='calibration-export-control-policy-v0.1-dev'
    || policy.runtime_web_surface_enabled!==false
    || policy.raw_export_materializer_enabled!==false
    || policy.collection_enabled!==false
    || policy.export_enabled!==false
  ) {
    throw new CalibrationOperatorCliError('POLICY_STATE_INVALID');
  }

  const args=parseCalibrationExportControlArgs(process.argv.slice(2));
  switch (args.command) {
    case 'request':
      return requestExport(args);
    case 'review':
      return reviewRequest(args);
    case 'approve':
      return decideRequest(args,'approved');
    case 'reject':
      return decideRequest(args,'rejected');
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
