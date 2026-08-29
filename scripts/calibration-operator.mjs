import fs from 'node:fs';
import process from 'node:process';
import postgres from 'postgres';
import {
  CALIBRATION_OPERATOR_ROLES,
  CalibrationOperatorCliError,
  generateCalibrationOperatorCredential,
  hashCalibrationOperatorCredential,
  parseCalibrationOperatorArgs,
  removeCredentialFileBestEffort,
  safeCliErrorCode,
  writeCredentialFileExclusive
} from './lib/calibration-operator-cli.mjs';

const policy=JSON.parse(
  fs.readFileSync('data/calibration/operator-auth-policy-v0.1-dev.json','utf8')
);

function outputJson(stream,value) {
  stream.write(`${JSON.stringify(value)}\n`);
}

function requirePostgresUrl(value,code) {
  if (typeof value !== 'string' || !/^postgres(?:ql)?:\/\//i.test(value)) {
    throw new CalibrationOperatorCliError(code);
  }
  return value;
}

function requireAdminEnvironment() {
  const ackName=policy.environments.admin_ack;
  const urlName=policy.environments.admin_database_url;

  if (process.env[ackName] !== policy.environments.admin_ack_value) {
    throw new CalibrationOperatorCliError('ADMIN_ACK_REQUIRED');
  }

  return requirePostgresUrl(
    process.env[urlName],
    'ADMIN_DATABASE_REQUIRED'
  );
}

function requireAuthEnvironment() {
  return requirePostgresUrl(
    process.env[policy.environments.auth_database_url],
    'AUTH_DATABASE_REQUIRED'
  );
}

function openDatabase(databaseUrl) {
  return postgres(databaseUrl,{
    max:1,
    connect_timeout:10,
    idle_timeout:5,
    prepare:true
  });
}

async function issueOperator(args) {
  const databaseUrl=requireAdminEnvironment();
  const credential=generateCalibrationOperatorCredential();

  writeCredentialFileExclusive(args.credentialOut,credential.token);

  const sql=openDatabase(databaseUrl);
  try {
    const result=await sql.begin(async (tx)=>{
      const [operator]=await tx`
        INSERT INTO calibration_operators (credential_hash)
        VALUES (${credential.tokenHashHex})
        RETURNING operator_id,status
      `;

      for (const role of args.roles) {
        await tx`
          INSERT INTO calibration_operator_roles (operator_id,role)
          VALUES (${operator.operator_id},${role})
        `;
      }

      return {
        operatorId:operator.operator_id,
        status:operator.status,
        roles:[...args.roles].sort()
      };
    });

    return {
      ok:true,
      command:'issue',
      ...result
    };
  } catch {
    removeCredentialFileBestEffort(args.credentialOut);
    throw new CalibrationOperatorCliError('ISSUE_FAILED');
  } finally {
    await sql.end({timeout:5});
  }
}

async function requireAdminOperator(sql,operatorId) {
  const [operator]=await sql`
    SELECT operator_id,status
    FROM calibration_operators
    WHERE operator_id=${operatorId}
  `;
  if (!operator) {
    throw new CalibrationOperatorCliError('OPERATOR_NOT_FOUND');
  }
  return operator;
}

async function grantRole(args) {
  const sql=openDatabase(requireAdminEnvironment());
  try {
    const operator=await requireAdminOperator(sql,args.operatorId);
    if (operator.status !== 'active') {
      throw new CalibrationOperatorCliError('OPERATOR_NOT_ACTIVE');
    }

    const changed=await sql`
      INSERT INTO calibration_operator_roles (operator_id,role)
      VALUES (${args.operatorId},${args.role})
      ON CONFLICT (operator_id,role) DO NOTHING
      RETURNING role
    `;

    return {
      ok:true,
      command:'grant-role',
      operatorId:args.operatorId,
      role:args.role,
      changed:changed.length===1
    };
  } finally {
    await sql.end({timeout:5});
  }
}

async function revokeRole(args) {
  const sql=openDatabase(requireAdminEnvironment());
  try {
    await requireAdminOperator(sql,args.operatorId);
    const changed=await sql`
      DELETE FROM calibration_operator_roles
      WHERE operator_id=${args.operatorId}
        AND role=${args.role}
      RETURNING role
    `;

    return {
      ok:true,
      command:'revoke-role',
      operatorId:args.operatorId,
      role:args.role,
      changed:changed.length===1
    };
  } finally {
    await sql.end({timeout:5});
  }
}

async function revokeCredential(args) {
  const sql=openDatabase(requireAdminEnvironment());
  try {
    const operator=await requireAdminOperator(sql,args.operatorId);
    if (operator.status === 'revoked') {
      return {
        ok:true,
        command:'revoke-credential',
        operatorId:args.operatorId,
        status:'revoked',
        changed:false
      };
    }

    const [revoked]=await sql`
      UPDATE calibration_operators
      SET status='revoked',revoked_at=now()
      WHERE operator_id=${args.operatorId}
      RETURNING operator_id,status
    `;

    if (!revoked) {
      throw new CalibrationOperatorCliError('REVOKE_FAILED');
    }

    return {
      ok:true,
      command:'revoke-credential',
      operatorId:revoked.operator_id,
      status:revoked.status,
      changed:true
    };
  } finally {
    await sql.end({timeout:5});
  }
}

async function whoAmI() {
  const databaseUrl=requireAuthEnvironment();
  const rawToken=process.env[policy.environments.auth_token];

  let tokenHashHex;
  try {
    tokenHashHex=hashCalibrationOperatorCredential(rawToken);
  } catch {
    throw new CalibrationOperatorCliError('AUTHENTICATION_FAILED');
  }

  const sql=openDatabase(databaseUrl);
  try {
    const rows=await sql`
      SELECT o.operator_id,o.status,r.role
      FROM calibration_operators o
      LEFT JOIN calibration_operator_roles r
        ON r.operator_id=o.operator_id
      WHERE o.credential_hash=${tokenHashHex}
      ORDER BY r.role ASC NULLS LAST
    `;

    if (rows.length===0 || rows[0].status!=='active') {
      throw new CalibrationOperatorCliError('AUTHENTICATION_FAILED');
    }

    return {
      ok:true,
      command:'whoami',
      operatorId:rows[0].operator_id,
      status:'active',
      roles:rows
        .map((row)=>row.role)
        .filter((role)=>typeof role==='string')
        .sort()
    };
  } catch (error) {
    if (error instanceof CalibrationOperatorCliError) throw error;
    throw new CalibrationOperatorCliError('AUTHENTICATION_FAILED');
  } finally {
    await sql.end({timeout:5});
  }
}

async function main() {
  if (
    policy.operator_auth_policy_version!=='calibration-operator-auth-policy-v0.1-dev' ||
    policy.runtime_web_surface_enabled!==false ||
    policy.raw_export_materializer_enabled!==false
  ) {
    throw new CalibrationOperatorCliError('POLICY_STATE_INVALID');
  }

  const args=parseCalibrationOperatorArgs(
    process.argv.slice(2),
    policy.roles ?? CALIBRATION_OPERATOR_ROLES
  );

  switch (args.command) {
    case 'issue':
      return issueOperator(args);
    case 'grant-role':
      return grantRole(args);
    case 'revoke-role':
      return revokeRole(args);
    case 'revoke-credential':
      return revokeCredential(args);
    case 'whoami':
      return whoAmI();
    default:
      throw new CalibrationOperatorCliError('INVALID_COMMAND');
  }
}

try {
  const result=await main();
  outputJson(process.stdout,result);
} catch (error) {
  outputJson(process.stderr,{
    ok:false,
    error:safeCliErrorCode(error)
  });
  process.exitCode=1;
}
