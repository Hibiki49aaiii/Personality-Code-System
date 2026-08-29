import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import postgres from 'postgres';

const databaseUrl=process.env.DATABASE_URL;
assert.ok(databaseUrl,'DATABASE_URL is required');

const owner=postgres(databaseUrl,{
  max:1,
  connect_timeout:10,
  idle_timeout:5
});

const AUTH_ROLE='pcs_calibration_auth';
const ADMIN_ROLE='pcs_calibration_admin';
const AUTH_PASSWORD='pcs-calibration-auth-ci-only';
const ADMIN_PASSWORD='pcs-calibration-admin-ci-only';
const ADMIN_ACK='calibration-operator-admin-v0.1-dev';

function roleDatabaseUrl(role,password) {
  const url=new URL(databaseUrl);
  url.username=role;
  url.password=password;
  return url.toString();
}

const authDatabaseUrl=roleDatabaseUrl(AUTH_ROLE,AUTH_PASSWORD);
const adminDatabaseUrl=roleDatabaseUrl(ADMIN_ROLE,ADMIN_PASSWORD);

async function roleExists(role) {
  const rows=await owner`
    SELECT 1
    FROM pg_roles
    WHERE rolname=${role}
  `;
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
  assert.fail(`${label}: expected database operation to be denied`);
}

function cleanCliEnv(extra={}) {
  const env={...process.env};
  delete env.PCS_CALIBRATION_OPERATOR_ADMIN_DATABASE_URL;
  delete env.PCS_CALIBRATION_AUTH_DATABASE_URL;
  delete env.PCS_CALIBRATION_OPERATOR_TOKEN;
  delete env.PCS_CALIBRATION_OPERATOR_ADMIN_ACK;
  return {...env,...extra};
}

function runCli(args,env) {
  return spawnSync(
    process.execPath,
    ['scripts/calibration-operator.mjs',...args],
    {
      cwd:process.cwd(),
      env,
      encoding:'utf8'
    }
  );
}

function parseStdout(result) {
  assert.equal(result.status,0,`expected CLI success, stderr=${result.stderr}`);
  assert.equal(result.signal,null);
  assert.equal(result.stderr,'');
  return JSON.parse(result.stdout.trim());
}

function parseFailure(result) {
  assert.equal(result.status,1,`expected CLI failure, stdout=${result.stdout}`);
  assert.equal(result.stdout,'');
  return JSON.parse(result.stderr.trim());
}

function assertNoSecretLeak(result,secrets) {
  const combined=`${result.stdout}\n${result.stderr}`;
  for (const secret of secrets) {
    if (!secret) continue;
    assert.equal(
      combined.includes(secret),
      false,
      'CLI output must not contain credential/hash/database secret material'
    );
  }
}

try {
  await dropRoleIfExists(AUTH_ROLE);
  await dropRoleIfExists(ADMIN_ROLE);

  await owner.unsafe(
    `CREATE ROLE ${AUTH_ROLE} LOGIN PASSWORD '${AUTH_PASSWORD}'`
  );
  await owner.unsafe(
    `CREATE ROLE ${ADMIN_ROLE} LOGIN PASSWORD '${ADMIN_PASSWORD}'`
  );

  const dbName=decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//,''));
  assert.match(dbName,/^[A-Za-z0-9_]+$/,'test database name must be simple identifier');
  const grants=readFileSync('ops/sql/calibration-operator-role-grants.sql','utf8')
    .replaceAll('CURRENT_DATABASE_PLACEHOLDER',`"${dbName}"`);
  await owner.unsafe(grants);

  const tables=await owner`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public'
      AND table_type='BASE TABLE'
    ORDER BY table_name
  `;
  const tableNames=tables.map((row)=>row.table_name);

  const expectedAuth={
    calibration_operators:new Set(['SELECT']),
    calibration_operator_roles:new Set(['SELECT'])
  };
  const expectedAdmin={
    calibration_operators:new Set(['SELECT','INSERT','UPDATE']),
    calibration_operator_roles:new Set(['SELECT','INSERT','DELETE'])
  };

  for (const [role,expected] of [
    [AUTH_ROLE,expectedAuth],
    [ADMIN_ROLE,expectedAdmin]
  ]) {
    for (const table of tableNames) {
      for (const privilege of ['SELECT','INSERT','UPDATE','DELETE']) {
        const [row]=await owner`
          SELECT has_table_privilege(
            ${role},
            ${`public.${table}`},
            ${privilege}
          ) AS allowed
        `;
        const shouldAllow=expected[table]?.has(privilege) ?? false;
        assert.equal(
          row.allowed,
          shouldAllow,
          `${role} ${table} ${privilege} privilege drift`
        );
      }
    }

    const [schemaUsage]=await owner`
      SELECT
        has_schema_privilege(${role},'public','USAGE') AS usage,
        has_schema_privilege(${role},'public','CREATE') AS create_allowed
    `;
    assert.equal(schemaUsage.usage,true,`${role} requires schema USAGE`);
    assert.equal(schemaUsage.create_allowed,false,`${role} must not CREATE in public schema`);
  }

  const authSql=postgres(authDatabaseUrl,{max:1,connect_timeout:10,idle_timeout:5});
  const adminSql=postgres(adminDatabaseUrl,{max:1,connect_timeout:10,idle_timeout:5});
  try {
    await expectDbDenied(
      'auth role operator write',
      ()=>authSql`
        INSERT INTO calibration_operators (credential_hash)
        VALUES (${'a'.repeat(64)})
      `
    );
    await expectDbDenied(
      'auth role ordinary session read',
      ()=>authSql`SELECT count(*) FROM anonymous_sessions`
    );
    await expectDbDenied(
      'admin role ordinary session read',
      ()=>adminSql`SELECT count(*) FROM anonymous_sessions`
    );
    await expectDbDenied(
      'admin role calibration consent read',
      ()=>adminSql`SELECT count(*) FROM calibration_consent_receipts`
    );
    await expectDbDenied(
      'admin role export request read',
      ()=>adminSql`SELECT count(*) FROM calibration_export_requests`
    );
    await expectDbDenied(
      'auth role DDL',
      ()=>authSql.unsafe('CREATE TABLE pcs_calibration_auth_forbidden(id integer)')
    );
    await expectDbDenied(
      'admin role DDL',
      ()=>adminSql.unsafe('CREATE TABLE pcs_calibration_admin_forbidden(id integer)')
    );
  } finally {
    await authSql.end({timeout:5});
    await adminSql.end({timeout:5});
  }

  const dir=mkdtempSync(join(tmpdir(),'pcs-calibration-auth-integration-'));
  const credentialPath=join(dir,'operator-token.txt');

  try {
    const adminEnv=cleanCliEnv({
      PCS_CALIBRATION_OPERATOR_ADMIN_DATABASE_URL:adminDatabaseUrl,
      PCS_CALIBRATION_OPERATOR_ADMIN_ACK:ADMIN_ACK
    });

    const issueResult=runCli(
      [
        'issue',
        '--role','calibration-reviewer',
        '--role','calibration-export-requester',
        '--credential-out',credentialPath
      ],
      adminEnv
    );
    const issued=parseStdout(issueResult);
    assert.equal(issued.ok,true);
    assert.equal(issued.command,'issue');
    assert.equal(issued.status,'active');
    assert.deepEqual(
      issued.roles,
      ['calibration-export-requester','calibration-reviewer']
    );
    assert.match(
      issued.operatorId,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    const rawToken=readFileSync(credentialPath,'utf8').trim();
    assert.match(rawToken,/^[A-Za-z0-9_-]{43}$/);
    assert.equal(statSync(credentialPath).mode & 0o777,0o600);

    const expectedHash=createHash('sha256').update(rawToken,'utf8').digest('hex');
    const [stored]=await owner`
      SELECT credential_hash,status
      FROM calibration_operators
      WHERE operator_id=${issued.operatorId}
    `;
    assert.ok(stored);
    assert.equal(stored.credential_hash,expectedHash);
    assert.equal(stored.status,'active');
    assert.notEqual(stored.credential_hash,rawToken);
    assertNoSecretLeak(issueResult,[rawToken,expectedHash,AUTH_PASSWORD,ADMIN_PASSWORD]);

    const authEnv=cleanCliEnv({
      PCS_CALIBRATION_AUTH_DATABASE_URL:authDatabaseUrl,
      PCS_CALIBRATION_OPERATOR_TOKEN:rawToken
    });

    const whoamiResult=runCli(['whoami'],authEnv);
    const identity=parseStdout(whoamiResult);
    assert.deepEqual(identity,{
      ok:true,
      command:'whoami',
      operatorId:issued.operatorId,
      status:'active',
      roles:['calibration-export-requester','calibration-reviewer']
    });
    assertNoSecretLeak(whoamiResult,[rawToken,expectedHash,AUTH_PASSWORD,ADMIN_PASSWORD]);

    const grantResult=runCli(
      [
        'grant-role',
        '--operator-id',issued.operatorId,
        '--role','calibration-export-approver'
      ],
      adminEnv
    );
    assert.deepEqual(parseStdout(grantResult),{
      ok:true,
      command:'grant-role',
      operatorId:issued.operatorId,
      role:'calibration-export-approver',
      changed:true
    });

    const grantAgain=runCli(
      [
        'grant-role',
        '--operator-id',issued.operatorId,
        '--role','calibration-export-approver'
      ],
      adminEnv
    );
    assert.equal(parseStdout(grantAgain).changed,false);

    const whoamiAfterGrant=parseStdout(runCli(['whoami'],authEnv));
    assert.deepEqual(
      whoamiAfterGrant.roles,
      [
        'calibration-export-approver',
        'calibration-export-requester',
        'calibration-reviewer'
      ]
    );

    const revokeRoleResult=runCli(
      [
        'revoke-role',
        '--operator-id',issued.operatorId,
        '--role','calibration-reviewer'
      ],
      adminEnv
    );
    assert.deepEqual(parseStdout(revokeRoleResult),{
      ok:true,
      command:'revoke-role',
      operatorId:issued.operatorId,
      role:'calibration-reviewer',
      changed:true
    });

    const revokeCredentialResult=runCli(
      ['revoke-credential','--operator-id',issued.operatorId],
      adminEnv
    );
    assert.deepEqual(parseStdout(revokeCredentialResult),{
      ok:true,
      command:'revoke-credential',
      operatorId:issued.operatorId,
      status:'revoked',
      changed:true
    });

    const revokeAgain=runCli(
      ['revoke-credential','--operator-id',issued.operatorId],
      adminEnv
    );
    assert.equal(parseStdout(revokeAgain).changed,false);

    const revokedAuth=runCli(['whoami'],authEnv);
    assert.deepEqual(parseFailure(revokedAuth),{
      ok:false,
      error:'AUTHENTICATION_FAILED'
    });

    const malformedAuth=runCli(
      ['whoami'],
      cleanCliEnv({
        PCS_CALIBRATION_AUTH_DATABASE_URL:authDatabaseUrl,
        PCS_CALIBRATION_OPERATOR_TOKEN:'not-a-token'
      })
    );
    assert.deepEqual(parseFailure(malformedAuth),{
      ok:false,
      error:'AUTHENTICATION_FAILED'
    });

    for (const result of [
      grantResult,
      grantAgain,
      revokeRoleResult,
      revokeCredentialResult,
      revokeAgain,
      revokedAuth,
      malformedAuth
    ]) {
      assertNoSecretLeak(result,[rawToken,expectedHash,AUTH_PASSWORD,ADMIN_PASSWORD]);
    }

    const missingAck=runCli(
      [
        'grant-role',
        '--operator-id',issued.operatorId,
        '--role','calibration-reviewer'
      ],
      cleanCliEnv({
        PCS_CALIBRATION_OPERATOR_ADMIN_DATABASE_URL:adminDatabaseUrl
      })
    );
    assert.deepEqual(parseFailure(missingAck),{
      ok:false,
      error:'ADMIN_ACK_REQUIRED'
    });

    const tokenArgv=runCli(
      ['whoami','--token',rawToken],
      authEnv
    );
    const tokenArgvError=parseFailure(tokenArgv);
    assert.equal(tokenArgvError.ok,false);
    assert.notEqual(tokenArgv.stderr.includes(rawToken),true);
  } finally {
    rmSync(dir,{recursive:true,force:true});
  }

  console.log('Calibration operator auth integration passed: dedicated auth/admin DB roles are least-privilege, issue writes a 0600 one-time credential file without output leakage, whoami authenticates active credentials, role changes are bounded and revocation makes authentication fail closed.');
} finally {
  await dropRoleIfExists(AUTH_ROLE);
  await dropRoleIfExists(ADMIN_ROLE);
  await owner.end({timeout:5});
}
