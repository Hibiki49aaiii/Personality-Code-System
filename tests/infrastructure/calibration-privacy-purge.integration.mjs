import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  rmSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import postgres from 'postgres';

const databaseUrl=process.env.DATABASE_URL;
assert.ok(databaseUrl,'DATABASE_URL is required');

const owner=postgres(databaseUrl,{max:1,connect_timeout:10,idle_timeout:5});

const AUTH_ROLE='pcs_calibration_auth';
const ADMIN_ROLE='pcs_calibration_admin';
const EXPORT_ROLE='pcs_calibration_export_control';
const PRIVACY_ROLE='pcs_calibration_privacy_control';

const AUTH_PASSWORD='pcs-purge-auth-ci-only';
const ADMIN_PASSWORD='pcs-purge-admin-ci-only';
const EXPORT_PASSWORD='pcs-purge-export-ci-only';
const PRIVACY_PASSWORD='pcs-purge-privacy-ci-only';
const ADMIN_ACK='calibration-operator-admin-v0.1-dev';

function tokenHash(label) {
  return createHash('sha256').update(label,'utf8').digest('hex');
}

function roleDatabaseUrl(role,password) {
  const url=new URL(databaseUrl);
  url.username=role;
  url.password=password;
  return url.toString();
}

const adminDatabaseUrl=roleDatabaseUrl(ADMIN_ROLE,ADMIN_PASSWORD);
const privacyDatabaseUrl=roleDatabaseUrl(PRIVACY_ROLE,PRIVACY_PASSWORD);

async function roleExists(role) {
  const rows=await owner`SELECT 1 FROM pg_roles WHERE rolname=${role}`;
  return rows.length===1;
}

async function dropRoleIfExists(role) {
  if (!(await roleExists(role))) return;
  await owner.unsafe(`DROP OWNED BY ${role}`);
  await owner.unsafe(`DROP ROLE ${role}`);
}

async function expectDbDenied(label,fn) {
  try {
    await fn();
  } catch (error) {
    const message=error instanceof Error ? error.message : String(error);
    assert.match(
      message,
      /permission denied|must be owner|not allowed|insufficient privilege/i,
      `${label}: unexpected database error: ${message}`
    );
    return;
  }
  assert.fail(`${label}: expected database denial`);
}

async function expectDbFailure(label,fn,pattern) {
  try {
    await fn();
  } catch (error) {
    const message=error instanceof Error ? error.message : String(error);
    assert.match(message,pattern,`${label}: unexpected database error: ${message}`);
    return;
  }
  assert.fail(`${label}: expected database failure`);
}

function cleanEnv(extra={}) {
  const env={...process.env};
  for (const key of [
    'PCS_CALIBRATION_OPERATOR_ADMIN_DATABASE_URL',
    'PCS_CALIBRATION_OPERATOR_ADMIN_ACK',
    'PCS_CALIBRATION_AUTH_DATABASE_URL',
    'PCS_CALIBRATION_EXPORT_CONTROL_DATABASE_URL',
    'PCS_CALIBRATION_PRIVACY_CONTROL_DATABASE_URL',
    'PCS_CALIBRATION_OPERATOR_TOKEN'
  ]) delete env[key];
  return {...env,...extra};
}

function run(script,args,env) {
  return spawnSync(process.execPath,[script,...args],{
    cwd:process.cwd(),
    env,
    encoding:'utf8'
  });
}

function runOperator(args,env) {
  return run('scripts/calibration-operator.mjs',args,env);
}

function runPurge(args,env) {
  return run('scripts/calibration-privacy-purge.mjs',args,env);
}

function success(result) {
  assert.equal(result.status,0,`expected CLI success; stderr=${result.stderr}`);
  assert.equal(result.stderr,'');
  return JSON.parse(result.stdout.trim());
}

function failure(result) {
  assert.equal(result.status,1,`expected CLI failure; stdout=${result.stdout}`);
  assert.equal(result.stdout,'');
  return JSON.parse(result.stderr.trim());
}

function assertNoLeak(result,secrets) {
  const output=`${result.stdout}\n${result.stderr}`;
  for (const secret of secrets.filter(Boolean)) {
    assert.equal(output.includes(secret),false,'purge/operator CLI leaked secret material');
  }
}

async function createRolesAndGrants() {
  for (const role of [AUTH_ROLE,ADMIN_ROLE,EXPORT_ROLE,PRIVACY_ROLE]) {
    await dropRoleIfExists(role);
  }

  await owner.unsafe(`CREATE ROLE ${AUTH_ROLE} LOGIN PASSWORD '${AUTH_PASSWORD}'`);
  await owner.unsafe(`CREATE ROLE ${ADMIN_ROLE} LOGIN PASSWORD '${ADMIN_PASSWORD}'`);
  await owner.unsafe(`CREATE ROLE ${EXPORT_ROLE} LOGIN PASSWORD '${EXPORT_PASSWORD}'`);
  await owner.unsafe(`CREATE ROLE ${PRIVACY_ROLE} LOGIN PASSWORD '${PRIVACY_PASSWORD}'`);

  const dbName=decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//,''));
  assert.match(dbName,/^[A-Za-z0-9_]+$/);
  const grants=readFileSync('ops/sql/calibration-operator-role-grants.sql','utf8')
    .replaceAll('CURRENT_DATABASE_PLACEHOLDER',`"${dbName}"`);
  await owner.unsafe(grants);
}

function issueCredential(dir,label,roles) {
  const path=join(dir,`${label}.txt`);
  const args=['issue'];
  for (const role of roles) args.push('--role',role);
  args.push('--credential-out',path);

  const result=runOperator(args,cleanEnv({
    PCS_CALIBRATION_OPERATOR_ADMIN_DATABASE_URL:adminDatabaseUrl,
    PCS_CALIBRATION_OPERATOR_ADMIN_ACK:ADMIN_ACK
  }));
  const issued=success(result);
  const token=readFileSync(path,'utf8').trim();
  const hash=createHash('sha256').update(token,'utf8').digest('hex');
  assertNoLeak(result,[token,hash,AUTH_PASSWORD,ADMIN_PASSWORD,EXPORT_PASSWORD,PRIVACY_PASSWORD]);
  return {issued,token,hash,path};
}

function purgeEnv(token) {
  return cleanEnv({
    PCS_CALIBRATION_PRIVACY_CONTROL_DATABASE_URL:privacyDatabaseUrl,
    PCS_CALIBRATION_OPERATOR_TOKEN:token
  });
}

async function createCompletedCalibrationRecord({
  label,
  consentVersion='calibration-consent-ja-v0.1-dev',
  purposeId='psychometric-calibration-v0.1',
  completedOffsetDays=0
}) {
  const [session]=await owner`
    INSERT INTO anonymous_sessions
      (access_token_hash,model_version,locale,status,expires_at,completed_at)
    VALUES
      (
        ${tokenHash(`purge-session:${label}`)},
        'assessment-dev-v0.3',
        'ja-JP',
        'completed',
        now()+interval '30 days',
        now()+${completedOffsetDays}*interval '1 day'
      )
    RETURNING session_id
  `;

  const [receipt]=await owner`
    INSERT INTO calibration_consent_receipts
      (session_id,assessment_model_version,consent_version,purpose_id,locale)
    VALUES
      (
        ${session.session_id},
        'assessment-dev-v0.3',
        ${consentVersion},
        ${purposeId},
        'ja-JP'
      )
    RETURNING consent_receipt_id
  `;

  const [link]=await owner`
    INSERT INTO calibration_record_links (consent_receipt_id)
    VALUES (${receipt.consent_receipt_id})
    RETURNING calibration_record_id
  `;

  await owner`
    INSERT INTO calibration_records
      (
        calibration_record_id,wave_id,assessment_model_version,item_bank_version,
        scoring_version,trait_dictionary_version,locale
      )
    VALUES
      (
        ${link.calibration_record_id},
        'beta-ja-wave-01-draft',
        'assessment-dev-v0.3',
        'item-bank-v0.2',
        'scoring-v0.1-dev',
        'trait-dictionary-v0.2',
        'ja-JP'
      )
  `;

  const inserted=await owner`
    INSERT INTO calibration_item_responses
      (calibration_record_id,item_id,item_revision,locale,value)
    SELECT
      ${link.calibration_record_id},
      item_id,
      item_revision,
      locale,
      3
    FROM assessment_model_items
    WHERE model_version='assessment-dev-v0.3'
    ORDER BY position
    RETURNING item_id
  `;
  assert.equal(inserted.length,147);

  const [record]=await owner`
    UPDATE calibration_records
    SET
      status='complete',
      completed_at=now()+${completedOffsetDays}*interval '1 day'
    WHERE calibration_record_id=${link.calibration_record_id}
    RETURNING calibration_record_id,status,completed_at
  `;
  assert.equal(record.status,'complete');

  return {
    sessionId:session.session_id,
    consentReceiptId:receipt.consent_receipt_id,
    calibrationRecordId:record.calibration_record_id,
    completedAt:record.completed_at
  };
}

async function withdrawConsent(record) {
  const [receipt]=await owner`
    UPDATE calibration_consent_receipts
    SET
      status='withdrawn',
      withdrawn_at=now(),
      updated_at=now()
    WHERE consent_receipt_id=${record.consentReceiptId}
    RETURNING status
  `;
  assert.equal(receipt.status,'withdrawn');
}

async function createClaimedRetestPair(label) {
  const baseline=await createCompletedCalibrationRecord({
    label:`${label}-baseline`,
    completedOffsetDays:-15
  });
  const retest=await createCompletedCalibrationRecord({
    label:`${label}-retest`,
    consentVersion:'calibration-retest-consent-ja-v0.1-dev',
    purposeId:'psychometric-calibration-retest-v0.1',
    completedOffsetDays:0
  });

  const [pair]=await owner`
    INSERT INTO calibration_retest_linkages
      (
        baseline_calibration_record_id,claim_token_hash,wave_id,assessment_model_version,
        item_bank_version,scoring_version,trait_dictionary_version,locale,
        eligible_from,eligible_until
      )
    VALUES
      (
        ${baseline.calibrationRecordId},
        ${tokenHash(`purge-claim:${label}`)},
        'beta-ja-wave-01-draft',
        'assessment-dev-v0.3',
        'item-bank-v0.2',
        'scoring-v0.1-dev',
        'trait-dictionary-v0.2',
        'ja-JP',
        (SELECT completed_at + interval '14 days'
         FROM calibration_records
         WHERE calibration_record_id=${baseline.calibrationRecordId}),
        (SELECT completed_at + interval '21 days'
         FROM calibration_records
         WHERE calibration_record_id=${baseline.calibrationRecordId})
      )
    RETURNING retest_pair_id
  `;

  const [claimed]=await owner`
    UPDATE calibration_retest_linkages
    SET
      status='claimed',
      retest_calibration_record_id=${retest.calibrationRecordId},
      claimed_at=now()
    WHERE retest_pair_id=${pair.retest_pair_id}
    RETURNING status
  `;
  assert.equal(claimed.status,'claimed');

  return {baseline,retest,retestPairId:pair.retest_pair_id};
}

try {
  await createRolesAndGrants();

  const tables=await owner`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE'
    ORDER BY table_name
  `;
  const tableNames=tables.map((row)=>row.table_name);

  for (const table of tableNames) {
    for (const privilege of ['SELECT','INSERT','UPDATE','DELETE']) {
      const [row]=await owner`
        SELECT has_table_privilege(
          ${PRIVACY_ROLE},
          ${`public.${table}`},
          ${privilege}
        ) AS allowed
      `;
      assert.equal(row.allowed,false,`${PRIVACY_ROLE} ${table} ${privilege} must remain denied`);
    }
  }

  const [schemaPrivilege]=await owner`
    SELECT
      has_schema_privilege(${PRIVACY_ROLE},'public','USAGE') AS usage,
      has_schema_privilege(${PRIVACY_ROLE},'public','CREATE') AS create_allowed
  `;
  assert.equal(schemaPrivilege.usage,true);
  assert.equal(schemaPrivilege.create_allowed,false);

  const functionMatrix=[
    ['public.pcs_authenticate_calibration_operator(text)',true],
    ['public.pcs_request_calibration_privacy_purge(text,uuid)',true],
    ['public.pcs_review_calibration_privacy_purge(text,uuid)',true],
    ['public.pcs_decide_calibration_privacy_purge(text,uuid,text)',true],
    ['public.pcs_require_active_calibration_operator_role(uuid,text)',false],
    ['public.pcs_finalize_calibration_record(uuid)',false],
    ['public.pcs_request_calibration_export(text,text,text,text,text,text,text,text,text,text)',false],
    ['public.pcs_review_calibration_export_request(text,uuid)',false],
    ['public.pcs_decide_calibration_export_request(text,uuid,text)',false]
  ];
  for (const [signature,expected] of functionMatrix) {
    const [row]=await owner`
      SELECT has_function_privilege(
        ${PRIVACY_ROLE},
        ${signature},
        'EXECUTE'
      ) AS allowed
    `;
    assert.equal(row.allowed,expected,`privacy role EXECUTE ${signature} drift`);
  }

  const privacySql=postgres(privacyDatabaseUrl,{max:1,connect_timeout:10,idle_timeout:5});
  try {
    await expectDbDenied(
      'privacy role calibration record read',
      ()=>privacySql`SELECT * FROM calibration_records LIMIT 1`
    );
    await expectDbDenied(
      'privacy role deletion journal read',
      ()=>privacySql`SELECT * FROM calibration_deletion_events LIMIT 1`
    );
    await expectDbDenied(
      'privacy role purge request table read',
      ()=>privacySql`SELECT * FROM calibration_privacy_purge_requests LIMIT 1`
    );
    await expectDbDenied(
      'privacy role direct calibration delete',
      ()=>privacySql`DELETE FROM calibration_records WHERE false`
    );
    await expectDbDenied(
      'privacy role DDL',
      ()=>privacySql.unsafe('CREATE TABLE pcs_privacy_purge_forbidden(id integer)')
    );
  } finally {
    await privacySql.end({timeout:5});
  }

  const dir=mkdtempSync(join(tmpdir(),'pcs-calibration-purge-'));
  try {
    const privacyOperator=issueCredential(
      dir,
      'privacy-operator',
      ['calibration-privacy-operator']
    );
    const reviewer=issueCredential(
      dir,
      'reviewer',
      ['calibration-reviewer']
    );
    const dual=issueCredential(
      dir,
      'dual',
      ['calibration-privacy-operator','calibration-reviewer']
    );
    const wrongRole=issueCredential(
      dir,
      'wrong-role',
      ['calibration-export-requester']
    );

    const noEvent=await createCompletedCalibrationRecord({label:'no-event'});
    assert.deepEqual(
      failure(runPurge(
        ['request','--calibration-record-id',noEvent.calibrationRecordId],
        purgeEnv(privacyOperator.token)
      )),
      {ok:false,error:'REQUEST_FAILED'}
    );

    const markerOnly=await createCompletedCalibrationRecord({label:'marker-only'});
    await owner`
      INSERT INTO calibration_deletion_events (calibration_record_id,reason)
      VALUES (${markerOnly.calibrationRecordId},'privacy-operator-purge')
    `;
    assert.deepEqual(
      failure(runPurge(
        ['request','--calibration-record-id',markerOnly.calibrationRecordId],
        purgeEnv(privacyOperator.token)
      )),
      {ok:false,error:'REQUEST_FAILED'}
    );

    const rejectRecord=await createCompletedCalibrationRecord({label:'reject'});
    await withdrawConsent(rejectRecord);

    assert.deepEqual(
      failure(runPurge(
        ['request','--calibration-record-id',rejectRecord.calibrationRecordId],
        purgeEnv(wrongRole.token)
      )),
      {ok:false,error:'REQUEST_FAILED'}
    );

    const rejectRequestResult=runPurge(
      ['request','--calibration-record-id',rejectRecord.calibrationRecordId],
      purgeEnv(privacyOperator.token)
    );
    const rejectRequest=success(rejectRequestResult);
    assert.equal(rejectRequest.status,'requested');
    assertNoLeak(rejectRequestResult,[
      privacyOperator.token,privacyOperator.hash,
      reviewer.token,reviewer.hash,
      PRIVACY_PASSWORD
    ]);

    assert.deepEqual(
      failure(runPurge(
        ['request','--calibration-record-id',rejectRecord.calibrationRecordId],
        purgeEnv(privacyOperator.token)
      )),
      {ok:false,error:'REQUEST_FAILED'}
    );

    const rejectReview=success(runPurge(
      ['review','--purge-request-id',rejectRequest.purgeRequestId],
      purgeEnv(reviewer.token)
    ));
    assert.equal(rejectReview.targetCount,1);
    assert.deepEqual(rejectReview.targets,[{
      calibrationRecordId:rejectRecord.calibrationRecordId,
      qualifyingReason:'consent-withdrawn'
    }]);

    const rejected=success(runPurge(
      ['reject','--purge-request-id',rejectRequest.purgeRequestId],
      purgeEnv(reviewer.token)
    ));
    assert.equal(rejected.status,'rejected');
    assert.equal(rejected.deletedRecordCount,0);

    const [rejectStillThere]=await owner`
      SELECT
        EXISTS(
          SELECT 1 FROM calibration_records
          WHERE calibration_record_id=${rejectRecord.calibrationRecordId}
        ) AS record_exists,
        (
          SELECT count(*)::int FROM calibration_item_responses
          WHERE calibration_record_id=${rejectRecord.calibrationRecordId}
        ) AS response_count
    `;
    assert.equal(rejectStillThere.record_exists,true);
    assert.equal(rejectStillThere.response_count,147);

    const [rejectAudit]=await owner`
      SELECT action,row_count,disposition
      FROM calibration_operator_audit_events
      WHERE action='privacy-purge-rejected'
        AND requester_operator_id=${privacyOperator.issued.operatorId}
      ORDER BY occurred_at DESC
      LIMIT 1
    `;
    assert.deepEqual(rejectAudit,{
      action:'privacy-purge-rejected',
      row_count:0,
      disposition:'rejected'
    });

    const confirmRequest=success(runPurge(
      ['request','--calibration-record-id',rejectRecord.calibrationRecordId],
      purgeEnv(privacyOperator.token)
    ));
    const confirmed=success(runPurge(
      ['confirm','--purge-request-id',confirmRequest.purgeRequestId],
      purgeEnv(reviewer.token)
    ));
    assert.equal(confirmed.status,'confirmed');
    assert.equal(confirmed.targetCount,1);
    assert.equal(confirmed.deletedRecordCount,1);

    const [confirmGone]=await owner`
      SELECT
        EXISTS(
          SELECT 1 FROM calibration_records
          WHERE calibration_record_id=${rejectRecord.calibrationRecordId}
        ) AS record_exists,
        (
          SELECT count(*)::int FROM calibration_item_responses
          WHERE calibration_record_id=${rejectRecord.calibrationRecordId}
        ) AS response_count
    `;
    assert.equal(confirmGone.record_exists,false);
    assert.equal(confirmGone.response_count,0);

    const deletionReasons=(await owner`
      SELECT reason
      FROM calibration_deletion_events
      WHERE calibration_record_id=${rejectRecord.calibrationRecordId}
      ORDER BY reason
    `).map((row)=>row.reason);
    assert.ok(deletionReasons.includes('consent-withdrawn'));
    assert.ok(deletionReasons.includes('privacy-operator-purge'));

    const [confirmedAudit]=await owner`
      SELECT action,row_count,artifact_sha256,disposition
      FROM calibration_operator_audit_events
      WHERE action='privacy-purge-confirmed'
        AND requester_operator_id=${privacyOperator.issued.operatorId}
      ORDER BY occurred_at DESC
      LIMIT 1
    `;
    assert.equal(confirmedAudit.action,'privacy-purge-confirmed');
    assert.equal(confirmedAudit.row_count,1);
    assert.equal(confirmedAudit.artifact_sha256,null);
    assert.equal(confirmedAudit.disposition,'purged');

    assert.deepEqual(
      failure(runPurge(
        ['confirm','--purge-request-id',confirmRequest.purgeRequestId],
        purgeEnv(reviewer.token)
      )),
      {ok:false,error:'DECISION_FAILED'}
    );

    const dualRecord=await createCompletedCalibrationRecord({label:'dual-self-review'});
    await withdrawConsent(dualRecord);
    const dualRequest=success(runPurge(
      ['request','--calibration-record-id',dualRecord.calibrationRecordId],
      purgeEnv(dual.token)
    ));
    assert.deepEqual(
      failure(runPurge(
        ['review','--purge-request-id',dualRequest.purgeRequestId],
        purgeEnv(dual.token)
      )),
      {ok:false,error:'REVIEW_FAILED'}
    );
    assert.deepEqual(
      failure(runPurge(
        ['confirm','--purge-request-id',dualRequest.purgeRequestId],
        purgeEnv(dual.token)
      )),
      {ok:false,error:'DECISION_FAILED'}
    );

    const pair=await createClaimedRetestPair('pair');
    await withdrawConsent(pair.baseline);

    const pairRequest=success(runPurge(
      ['request','--calibration-record-id',pair.baseline.calibrationRecordId],
      purgeEnv(privacyOperator.token)
    ));
    const pairReview=success(runPurge(
      ['review','--purge-request-id',pairRequest.purgeRequestId],
      purgeEnv(reviewer.token)
    ));
    assert.equal(pairReview.targetCount,2);
    assert.deepEqual(
      new Set(pairReview.targets.map((target)=>target.calibrationRecordId)),
      new Set([
        pair.baseline.calibrationRecordId,
        pair.retest.calibrationRecordId
      ])
    );
    const targetReasonById=new Map(
      pairReview.targets.map((target)=>[target.calibrationRecordId,target.qualifyingReason])
    );
    assert.equal(targetReasonById.get(pair.baseline.calibrationRecordId),'consent-withdrawn');
    assert.equal(targetReasonById.get(pair.retest.calibrationRecordId),'retest-pair-invalidated');

    const pairConfirmed=success(runPurge(
      ['confirm','--purge-request-id',pairRequest.purgeRequestId],
      purgeEnv(reviewer.token)
    ));
    assert.equal(pairConfirmed.deletedRecordCount,2);

    const pairRows=await owner`
      SELECT calibration_record_id
      FROM calibration_records
      WHERE calibration_record_id IN (
        ${pair.baseline.calibrationRecordId},
        ${pair.retest.calibrationRecordId}
      )
    `;
    assert.equal(pairRows.length,0);

    const pairAnswers=await owner`
      SELECT calibration_record_id
      FROM calibration_item_responses
      WHERE calibration_record_id IN (
        ${pair.baseline.calibrationRecordId},
        ${pair.retest.calibrationRecordId}
      )
    `;
    assert.equal(pairAnswers.length,0);

    const pairLinkRows=await owner`
      SELECT retest_pair_id
      FROM calibration_retest_linkages
      WHERE retest_pair_id=${pair.retestPairId}
    `;
    assert.equal(pairLinkRows.length,0);

    for (const recordId of [
      pair.baseline.calibrationRecordId,
      pair.retest.calibrationRecordId
    ]) {
      const reasons=(await owner`
        SELECT reason
        FROM calibration_deletion_events
        WHERE calibration_record_id=${recordId}
        ORDER BY reason
      `).map((row)=>row.reason);
      assert.ok(reasons.includes('retest-pair-invalidated'));
      assert.ok(reasons.includes('privacy-operator-purge'));
    }

    const immutableRecord=await createCompletedCalibrationRecord({label:'immutable-request'});
    await withdrawConsent(immutableRecord);
    const immutableRequest=success(runPurge(
      ['request','--calibration-record-id',immutableRecord.calibrationRecordId],
      purgeEnv(privacyOperator.token)
    ));
    await expectDbFailure(
      'purge request direct delete',
      ()=>owner`
        DELETE FROM calibration_privacy_purge_requests
        WHERE purge_request_id=${immutableRequest.purgeRequestId}
      `,
      /retained governance records/i
    );
    await expectDbFailure(
      'purge target mutation',
      ()=>owner`
        UPDATE calibration_privacy_purge_request_targets
        SET qualifying_reason='owner-session-deleted'
        WHERE purge_request_id=${immutableRequest.purgeRequestId}
      `,
      /targets are immutable/i
    );

    const revokedRecord=await createCompletedCalibrationRecord({label:'revoked'});
    await withdrawConsent(revokedRecord);
    const revokedPrivacy=issueCredential(
      dir,
      'revoked-privacy',
      ['calibration-privacy-operator']
    );
    const revokeResult=success(runOperator(
      ['revoke-credential','--operator-id',revokedPrivacy.issued.operatorId],
      cleanEnv({
        PCS_CALIBRATION_OPERATOR_ADMIN_DATABASE_URL:adminDatabaseUrl,
        PCS_CALIBRATION_OPERATOR_ADMIN_ACK:ADMIN_ACK
      })
    ));
    assert.equal(revokeResult.status,'revoked');

    assert.deepEqual(
      failure(runPurge(
        ['request','--calibration-record-id',revokedRecord.calibrationRecordId],
        purgeEnv(revokedPrivacy.token)
      )),
      {ok:false,error:'REQUEST_FAILED'}
    );
    assert.deepEqual(
      failure(runPurge(
        ['request','--calibration-record-id',revokedRecord.calibrationRecordId],
        purgeEnv('A'.repeat(43))
      )),
      {ok:false,error:'REQUEST_FAILED'}
    );

    const tokenArgv=runPurge(
      [
        'request',
        '--calibration-record-id',revokedRecord.calibrationRecordId,
        '--token',privacyOperator.token
      ],
      purgeEnv(privacyOperator.token)
    );
    assert.deepEqual(failure(tokenArgv),{
      ok:false,
      error:'TOKEN_ARGV_FORBIDDEN'
    });
    assertNoLeak(tokenArgv,[privacyOperator.token,privacyOperator.hash]);

    console.log('Calibration privacy purge integration passed: execute-only privacy control cannot access tables directly, only pre-journaled privacy targets can be requested, rejected requests are non-destructive, confirmed purges remove row-level answers while retaining deletion evidence, and retest-pair invalidation purges both eligible members.');
  } finally {
    rmSync(dir,{recursive:true,force:true});
  }
} finally {
  for (const role of [AUTH_ROLE,ADMIN_ROLE,EXPORT_ROLE,PRIVACY_ROLE]) {
    await dropRoleIfExists(role);
  }
  await owner.end({timeout:5});
}
