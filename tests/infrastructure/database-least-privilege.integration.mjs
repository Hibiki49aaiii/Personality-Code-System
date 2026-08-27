import assert from 'node:assert/strict';
import postgres from 'postgres';
import fs from 'node:fs';

const databaseUrl=process.env.DATABASE_URL;
assert.ok(databaseUrl,'DATABASE_URL is required');
const policy=JSON.parse(fs.readFileSync('data/security/database-role-policy-v0.1-dev.json','utf8'));

const admin=postgres(databaseUrl,{max:1,connect_timeout:10,idle_timeout:3});

async function expectDenied(label,fn,pattern=/permission denied|must be owner/i) {
  try {
    await fn();
  } catch (error) {
    const message=error instanceof Error ? error.message : String(error);
    assert.match(message,pattern,`${label}: unexpected denial: ${message}`);
    return;
  }
  assert.fail(`${label}: expected permission denial`);
}

try {
  await admin.unsafe('DROP ROLE IF EXISTS pcs_runtime_ci');
  await admin.unsafe("CREATE ROLE pcs_runtime_ci LOGIN PASSWORD 'pcs-runtime-ci-password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION");
  const [{db_name}] = await admin`SELECT current_database() AS db_name`;
  await admin.unsafe(`GRANT CONNECT ON DATABASE "${String(db_name).replaceAll('"','""')}" TO pcs_runtime_ci`);
  await admin.unsafe('GRANT USAGE ON SCHEMA public TO pcs_runtime_ci');
  await admin.unsafe('REVOKE CREATE ON SCHEMA public FROM pcs_runtime_ci');

  for (const [table,privileges] of Object.entries(policy.runtime_table_privileges)) {
    await admin.unsafe(`GRANT ${privileges.join(', ')} ON TABLE "${table}" TO pcs_runtime_ci`);
  }

  const url=new URL(databaseUrl);
  url.username='pcs_runtime_ci';
  url.password='pcs-runtime-ci-password';
  const runtime=postgres(url.toString(),{max:1,connect_timeout:10,idle_timeout:3});

  try {
    const [identity]=await runtime`
      SELECT
        current_user AS current_user,
        has_schema_privilege(current_user,'public','USAGE') AS schema_usage,
        has_schema_privilege(current_user,'public','CREATE') AS schema_create
    `;
    assert.equal(identity.current_user,'pcs_runtime_ci');
    assert.equal(identity.schema_usage,true);
    assert.equal(identity.schema_create,false);

    for (const [table,privileges] of Object.entries(policy.runtime_table_privileges)) {
      for (const privilege of ['SELECT','INSERT','UPDATE','DELETE']) {
        const [{allowed}]=await runtime`
          SELECT has_table_privilege(current_user,${table},${privilege}) AS allowed
        `;
        assert.equal(
          allowed,
          privileges.includes(privilege),
          `${table} ${privilege}: grant differs from machine policy`
        );
      }
    }

    const [{model_count}]=await runtime`
      SELECT count(*)::int AS model_count FROM assessment_model_releases
    `;
    assert.ok(model_count >= 1,'runtime role must read versioned model releases');

    const tokenHash='9'.repeat(64);
    const [session]=await runtime`
      INSERT INTO anonymous_sessions
        (access_token_hash,model_version,locale,expires_at)
      VALUES
        (${tokenHash},'assessment-dev-v0.1','ja-JP',now()+interval '1 hour')
      RETURNING session_id
    `;
    assert.ok(session?.session_id);
    await runtime`
      UPDATE anonymous_sessions SET updated_at=now()
      WHERE session_id=${session.session_id}
    `;
    await runtime`
      DELETE FROM anonymous_sessions WHERE session_id=${session.session_id}
    `;

    const [event]=await runtime`
      INSERT INTO product_events
        (event_dictionary_version,event_name,event_source,properties_json)
      VALUES
        ('analytics-events-v0.1-dev','client_error','client',${runtime.json({category:'network'})})
      RETURNING event_id
    `;
    assert.ok(event?.event_id);
    await runtime`DELETE FROM product_events WHERE event_id=${event.event_id}`;

    const bucketHash='8'.repeat(64);
    await runtime`
      INSERT INTO rate_limit_buckets
        (bucket_hash,scope,window_start,expires_at,request_count)
      VALUES
        (${bucketHash},'assessment-session-create',now(),now()+interval '1 minute',1)
    `;
    await runtime`
      UPDATE rate_limit_buckets SET request_count=request_count+1,updated_at=now()
      WHERE bucket_hash=${bucketHash}
    `;
    await runtime`DELETE FROM rate_limit_buckets WHERE bucket_hash=${bucketHash}`;

    await expectDenied(
      'create table',
      ()=>runtime.unsafe('CREATE TABLE pcs_runtime_forbidden(id integer)')
    );
    await expectDenied(
      'alter application table',
      ()=>runtime.unsafe('ALTER TABLE product_events ADD COLUMN pcs_forbidden integer')
    );
    await expectDenied(
      'write versioned definition',
      ()=>runtime`INSERT INTO trait_definitions (trait_id) VALUES ('FORBIDDEN_RUNTIME_WRITE')`
    );
    await expectDenied(
      'delete versioned model release',
      ()=>runtime`DELETE FROM assessment_model_releases WHERE model_version='assessment-dev-v0.1'`
    );

    console.log('Database least-privilege integration passed: runtime role can perform required representative DML/read operations but cannot create/alter schema objects or write versioned definitions.');
  } finally {
    await runtime.end({timeout:3});
  }
} finally {
  await admin.unsafe('DROP ROLE IF EXISTS pcs_runtime_ci');
  await admin.end({timeout:3});
}
