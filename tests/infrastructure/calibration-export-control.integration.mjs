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
const CONTROL_ROLE='pcs_calibration_export_control';
const AUTH_PASSWORD='pcs-export-auth-ci-only';
const ADMIN_PASSWORD='pcs-export-admin-ci-only';
const CONTROL_PASSWORD='pcs-export-control-ci-only';
const ADMIN_ACK='calibration-operator-admin-v0.1-dev';

function roleDatabaseUrl(role,password) {
  const url=new URL(databaseUrl);
  url.username=role;
  url.password=password;
  return url.toString();
}
const authDatabaseUrl=roleDatabaseUrl(AUTH_ROLE,AUTH_PASSWORD);
const adminDatabaseUrl=roleDatabaseUrl(ADMIN_ROLE,ADMIN_PASSWORD);
const controlDatabaseUrl=roleDatabaseUrl(CONTROL_ROLE,CONTROL_PASSWORD);

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
    assert.match(message,/permission denied|must be owner|not allowed|insufficient privilege/i,`${label}: unexpected database error: ${message}`);
    return;
  }
  assert.fail(`${label}: expected denial`);
}
async function expectDbFailure(label,fn,pattern) {
  try {
    await fn();
  } catch (error) {
    const message=error instanceof Error ? error.message : String(error);
    assert.match(message,pattern,`${label}: unexpected database error: ${message}`);
    return;
  }
  assert.fail(`${label}: expected failure`);
}

function cleanEnv(extra={}) {
  const env={...process.env};
  for (const key of [
    'PCS_CALIBRATION_OPERATOR_ADMIN_DATABASE_URL',
    'PCS_CALIBRATION_OPERATOR_ADMIN_ACK',
    'PCS_CALIBRATION_AUTH_DATABASE_URL',
    'PCS_CALIBRATION_EXPORT_CONTROL_DATABASE_URL',
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
function runControl(args,env) {
  return run('scripts/calibration-export-control.mjs',args,env);
}
function success(result) {
  assert.equal(result.status,0,`expected success; stderr=${result.stderr}`);
  assert.equal(result.stderr,'');
  return JSON.parse(result.stdout.trim());
}
function failure(result) {
  assert.equal(result.status,1,`expected failure; stdout=${result.stdout}`);
  assert.equal(result.stdout,'');
  return JSON.parse(result.stderr.trim());
}
function assertNoLeak(result,secrets) {
  const output=`${result.stdout}\n${result.stderr}`;
  for (const secret of secrets.filter(Boolean)) {
    assert.equal(output.includes(secret),false,'control/operator CLI leaked secret material');
  }
}

async function createRolesAndGrants() {
  for (const role of [AUTH_ROLE,ADMIN_ROLE,CONTROL_ROLE]) await dropRoleIfExists(role);
  await owner.unsafe(`CREATE ROLE ${AUTH_ROLE} LOGIN PASSWORD '${AUTH_PASSWORD}'`);
  await owner.unsafe(`CREATE ROLE ${ADMIN_ROLE} LOGIN PASSWORD '${ADMIN_PASSWORD}'`);
  await owner.unsafe(`CREATE ROLE ${CONTROL_ROLE} LOGIN PASSWORD '${CONTROL_PASSWORD}'`);

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
  assertNoLeak(result,[token,hash,AUTH_PASSWORD,ADMIN_PASSWORD,CONTROL_PASSWORD]);
  return {issued,token,hash,path};
}

function controlEnv(token) {
  return cleanEnv({
    PCS_CALIBRATION_EXPORT_CONTROL_DATABASE_URL:controlDatabaseUrl,
    PCS_CALIBRATION_OPERATOR_TOKEN:token
  });
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
  const expectedAdmin={
    calibration_operators:new Set(['SELECT','INSERT','UPDATE']),
    calibration_operator_roles:new Set(['SELECT','INSERT','DELETE'])
  };
  for (const [role,expected] of [
    [AUTH_ROLE,{}],
    [CONTROL_ROLE,{}],
    [ADMIN_ROLE,expectedAdmin]
  ]) {
    for (const table of tableNames) {
      for (const privilege of ['SELECT','INSERT','UPDATE','DELETE']) {
        const [row]=await owner`
          SELECT has_table_privilege(${role},${`public.${table}`},${privilege}) AS allowed
        `;
        assert.equal(
          row.allowed,
          expected[table]?.has(privilege) ?? false,
          `${role} ${table} ${privilege} privilege drift`
        );
      }
    }
    const [schema]=await owner`
      SELECT
        has_schema_privilege(${role},'public','USAGE') AS usage,
        has_schema_privilege(${role},'public','CREATE') AS create_allowed
    `;
    assert.equal(schema.usage,true);
    assert.equal(schema.create_allowed,false);
  }

  const signatures={
    helper:'public.pcs_require_active_calibration_operator_role(uuid,text)',
    auth:'public.pcs_authenticate_calibration_operator(text)',
    request:'public.pcs_request_calibration_export(text,text,text,text,text,text,text,text,text,text)',
    review:'public.pcs_review_calibration_export_request(text,uuid)',
    decide:'public.pcs_decide_calibration_export_request(text,uuid,text)'
  };
  for (const [role,allowed] of [
    [AUTH_ROLE,new Set(['auth'])],
    [CONTROL_ROLE,new Set(['auth','request','review','decide'])],
    [ADMIN_ROLE,new Set()]
  ]) {
    for (const [name,signature] of Object.entries(signatures)) {
      const [row]=await owner`
        SELECT has_function_privilege(${role},${signature},'EXECUTE') AS allowed
      `;
      assert.equal(row.allowed,allowed.has(name),`${role} EXECUTE ${name} drift`);
    }
  }

  const controlSql=postgres(controlDatabaseUrl,{max:1,connect_timeout:10,idle_timeout:5});
  const authSql=postgres(authDatabaseUrl,{max:1,connect_timeout:10,idle_timeout:5});
  try {
    for (const sql of [controlSql,authSql]) {
      await expectDbDenied('operator hash table read',()=>sql`SELECT credential_hash FROM calibration_operators LIMIT 1`);
      await expectDbDenied('export request table read',()=>sql`SELECT * FROM calibration_export_requests LIMIT 1`);
      await expectDbDenied('audit table read',()=>sql`SELECT * FROM calibration_operator_audit_events LIMIT 1`);
    }
    await expectDbDenied(
      'control DDL',
      ()=>controlSql.unsafe('CREATE TABLE pcs_control_forbidden(id integer)')
    );
  } finally {
    await controlSql.end({timeout:5});
    await authSql.end({timeout:5});
  }

  const dir=mkdtempSync(join(tmpdir(),'pcs-export-control-'));
  try {
    const requester=issueCredential(dir,'requester',['calibration-export-requester']);
    const approver=issueCredential(dir,'approver',['calibration-export-approver']);
    const reviewer=issueCredential(dir,'reviewer',['calibration-reviewer']);
    const dual=issueCredential(dir,'dual',['calibration-export-requester','calibration-export-approver']);

    const requestResult=runControl(
      ['request','--purpose-code','wave-primary-analysis'],
      controlEnv(requester.token)
    );
    const requested=success(requestResult);
    assert.equal(requested.command,'request');
    assert.equal(requested.status,'requested');
    assert.equal(requested.purposeCode,'wave-primary-analysis');
    assert.deepEqual(requested.scope,{
      waveId:'beta-ja-wave-01-draft',
      exportSchemaVersion:'calibration-export-record-v0.1-dev',
      consentVersion:'calibration-consent-ja-v0.1-dev',
      assessmentModelVersion:'assessment-dev-v0.3',
      itemBankVersion:'item-bank-v0.2',
      scoringVersion:'scoring-v0.1-dev',
      traitDictionaryVersion:'trait-dictionary-v0.2',
      locale:'ja-JP'
    });
    assertNoLeak(requestResult,[requester.token,requester.hash,CONTROL_PASSWORD]);

    const [storedRequest]=await owner`
      SELECT *
      FROM calibration_export_requests
      WHERE request_id=${requested.requestId}
    `;
    assert.ok(storedRequest);
    assert.equal(storedRequest.requester_operator_id,requester.issued.operatorId);
    assert.equal(storedRequest.status,'requested');

    const approverReview=success(runControl(
      ['review','--request-id',requested.requestId],
      controlEnv(approver.token)
    ));
    assert.equal(approverReview.requestId,requested.requestId);
    assert.equal(approverReview.status,'requested');
    assert.equal(approverReview.requesterOperatorId,requester.issued.operatorId);
    assert.equal(approverReview.approverOperatorId,null);

    const reviewerReview=success(runControl(
      ['review','--request-id',requested.requestId],
      controlEnv(reviewer.token)
    ));
    assert.equal(reviewerReview.requestId,requested.requestId);

    assert.deepEqual(
      failure(runControl(['review','--request-id',requested.requestId],controlEnv(requester.token))),
      {ok:false,error:'REVIEW_FAILED'}
    );

    const approved=success(runControl(
      ['approve','--request-id',requested.requestId],
      controlEnv(approver.token)
    ));
    assert.equal(approved.status,'approved');
    assert.equal(approved.requesterOperatorId,requester.issued.operatorId);
    assert.equal(approved.approverOperatorId,approver.issued.operatorId);

    const auditRows=await owner`
      SELECT action,requester_operator_id,approver_operator_id,purpose_code,wave_id,
             export_schema_version,consent_version,assessment_model_version,item_bank_version,
             scoring_version,trait_dictionary_version,locale,row_count,artifact_sha256,disposition
      FROM calibration_operator_audit_events
      WHERE requester_operator_id=${requester.issued.operatorId}
        AND purpose_code='wave-primary-analysis'
    `;
    assert.equal(auditRows.length,1);
    assert.equal(auditRows[0].action,'export-approved');
    assert.equal(auditRows[0].approver_operator_id,approver.issued.operatorId);
    assert.equal(auditRows[0].row_count,null);
    assert.equal(auditRows[0].artifact_sha256,null);
    assert.equal(auditRows[0].disposition,'approved');

    assert.deepEqual(
      failure(runControl(['reject','--request-id',requested.requestId],controlEnv(approver.token))),
      {ok:false,error:'DECISION_FAILED'}
    );

    const dualRequest=success(runControl(
      ['request','--purpose-code','self-approval-test'],
      controlEnv(dual.token)
    ));
    assert.deepEqual(
      failure(runControl(['approve','--request-id',dualRequest.requestId],controlEnv(dual.token))),
      {ok:false,error:'DECISION_FAILED'}
    );

    const rejectedRequest=success(runControl(
      ['request','--purpose-code','wave-sensitivity-analysis'],
      controlEnv(requester.token)
    ));
    const rejected=success(runControl(
      ['reject','--request-id',rejectedRequest.requestId],
      controlEnv(approver.token)
    ));
    assert.equal(rejected.status,'rejected');
    const [rejectedAudit]=await owner`
      SELECT action,disposition
      FROM calibration_operator_audit_events
      WHERE requester_operator_id=${requester.issued.operatorId}
        AND purpose_code='wave-sensitivity-analysis'
    `;
    assert.deepEqual(rejectedAudit,{action:'export-rejected',disposition:'rejected'});

    const controlDirect=postgres(controlDatabaseUrl,{max:1,connect_timeout:10,idle_timeout:5});
    try {
      await expectDbFailure(
        'direct SQL alternate scope',
        ()=>controlDirect`
          SELECT public.pcs_request_calibration_export(
            ${requester.hash},
            'alternate-scope-test',
            'beta-ja-wave-01-draft',
            'calibration-export-record-v0.1-dev',
            'calibration-consent-ja-v0.1-dev',
            'assessment-dev-v0.2',
            'item-bank-v0.2',
            'scoring-v0.1-dev',
            'trait-dictionary-v0.2',
            'ja-JP'
          )
        `,
        /scope mismatch/i
      );
      await expectDbFailure(
        'direct SQL reviewer decision',
        ()=>controlDirect`
          SELECT * FROM public.pcs_decide_calibration_export_request(
            ${reviewer.hash},
            ${dualRequest.requestId}::uuid,
            'approved'
          )
        `,
        /authorization failed/i
      );
      await expectDbFailure(
        'direct SQL self approval',
        ()=>controlDirect`
          SELECT * FROM public.pcs_decide_calibration_export_request(
            ${dual.hash},
            ${dualRequest.requestId}::uuid,
            'approved'
          )
        `,
        /self approval forbidden/i
      );
    } finally {
      await controlDirect.end({timeout:5});
    }

    const revokeRequester=success(runOperator(
      ['revoke-credential','--operator-id',requester.issued.operatorId],
      cleanEnv({
        PCS_CALIBRATION_OPERATOR_ADMIN_DATABASE_URL:adminDatabaseUrl,
        PCS_CALIBRATION_OPERATOR_ADMIN_ACK:ADMIN_ACK
      })
    ));
    assert.equal(revokeRequester.status,'revoked');

    assert.deepEqual(
      failure(runControl(['request','--purpose-code','revoked-test'],controlEnv(requester.token))),
      {ok:false,error:'REQUEST_FAILED'}
    );
    assert.deepEqual(
      failure(runControl(
        ['request','--purpose-code','unknown-test'],
        controlEnv('A'.repeat(43))
      )),
      {ok:false,error:'REQUEST_FAILED'}
    );

    const forbiddenScope=runControl(
      ['request','--purpose-code','argv-test','--assessment-model-version','assessment-dev-v999'],
      controlEnv(approver.token)
    );
    assert.deepEqual(failure(forbiddenScope),{ok:false,error:'SCOPE_ARGV_FORBIDDEN'});

    for (const result of [requestResult,forbiddenScope]) {
      assertNoLeak(result,[
        requester.token,requester.hash,
        approver.token,approver.hash,
        reviewer.token,reviewer.hash,
        dual.token,dual.hash,
        AUTH_PASSWORD,ADMIN_PASSWORD,CONTROL_PASSWORD
      ]);
    }
  } finally {
    rmSync(dir,{recursive:true,force:true});
  }

  console.log('Calibration export control integration passed: execute-only auth/control DB roles have zero direct table access, frozen-scope requests require requester tokens, review/decision roles are enforced, self/repeat decisions fail, and approve/reject write one bounded audit event without raw materialization.');
} finally {
  for (const role of [AUTH_ROLE,ADMIN_ROLE,CONTROL_ROLE]) await dropRoleIfExists(role);
  await owner.end({timeout:5});
}
