import assert from 'node:assert/strict';
import { mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import postgres from 'postgres';
import policy from '../../data/operations/backup-restore-policy-v0.1-dev.json' with { type: 'json' };

const databaseUrl=process.env.DATABASE_URL;
assert.ok(databaseUrl,'DATABASE_URL is required');
const dumpPath='.tmp-tests/pcs-backup-restore-ci.dump';
const restoreDb='pcs_restore_ci';

function run(command,args) {
  const result=spawnSync(command,args,{encoding:'utf8',env:process.env});
  assert.equal(
    result.status,
    0,
    `${command} failed (status ${result.status})\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
  return result;
}

async function expectDbFailure(label,fn,pattern) {
  try {
    await fn();
  } catch (error) {
    const message=error instanceof Error ? error.message : String(error);
    assert.match(message,pattern,`${label}: unexpected restored-DB error: ${message}`);
    return;
  }
  assert.fail(`${label}: expected database operation to fail`);
}

const source=postgres(databaseUrl,{max:1,connect_timeout:10,idle_timeout:3});
let restored;
try {
  await mkdir('.tmp-tests',{recursive:true});

  run('pg_dump',[
    '--format=custom',
    '--no-owner',
    '--no-acl',
    `--file=${dumpPath}`,
    databaseUrl
  ]);

  await source.unsafe(`DROP DATABASE IF EXISTS ${restoreDb} WITH (FORCE)`);
  await source.unsafe(`CREATE DATABASE ${restoreDb}`);

  const restoreUrl=new URL(databaseUrl);
  restoreUrl.pathname=`/${restoreDb}`;

  run('pg_restore',[
    '--exit-on-error',
    '--no-owner',
    '--no-acl',
    `--dbname=${restoreUrl.toString()}`,
    dumpPath
  ]);

  restored=postgres(restoreUrl.toString(),{max:1,connect_timeout:10,idle_timeout:3});

  const tables=Object.keys(
    Object.fromEntries(
      (await source`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname='public'
        ORDER BY tablename
      `).map((row)=>[row.tablename,true])
    )
  );
  assert.ok(tables.length>=16,'source must contain the PCS application tables');

  for (const table of tables) {
    if (!/^[a-z][a-z0-9_]+$/.test(table)) throw new Error(`unexpected table name ${table}`);
    const [sourceCount]=await source.unsafe(`SELECT count(*)::int AS row_count FROM "${table}"`);
    const [restoredCount]=await restored.unsafe(`SELECT count(*)::int AS row_count FROM "${table}"`);
    assert.equal(
      restoredCount.row_count,
      sourceCount.row_count,
      `${table}: restored row count differs from source`
    );
  }

  const [sourceTriggers]=await source`
    SELECT count(*)::int AS trigger_count
    FROM pg_trigger
    WHERE NOT tgisinternal
  `;
  const [restoredTriggers]=await restored`
    SELECT count(*)::int AS trigger_count
    FROM pg_trigger
    WHERE NOT tgisinternal
  `;
  assert.equal(restoredTriggers.trigger_count,sourceTriggers.trigger_count,'non-internal trigger count must survive logical restore');

  const [revision] = await restored`
    SELECT trait_id, dictionary_version, locale
    FROM trait_definition_revisions
    ORDER BY trait_id, dictionary_version, locale
    LIMIT 1
  `;
  assert.ok(revision?.trait_id,'restored DB must contain an immutable Trait revision fixture');

  await expectDbFailure(
    'versioned revision rows are immutable after restore',
    ()=>restored`
      UPDATE trait_definition_revisions
      SET display_name = display_name || ' forbidden'
      WHERE trait_id=${revision.trait_id}
        AND dictionary_version=${revision.dictionary_version}
        AND locale=${revision.locale}
    `,
    /versioned revision rows are immutable/i
  );

  assert.equal(policy.restore_quarantine_required,true);
  assert.equal(policy.public_traffic_during_restore_allowed,false);
  assert.equal(policy.privacy_restore_boundary.production_restore_privacy_safe,false);

  console.log(JSON.stringify({
    backupRestorePolicyVersion:policy.backup_restore_policy_version,
    format:'pg_dump-custom',
    tableCount:tables.length,
    nonInternalTriggerCount:restoredTriggers.trigger_count,
    publicTrafficAllowedDuringRestore:false,
    productionRestorePrivacySafe:false,
    note:'CI restore integrity proven; production deletion-journal replay/provider evidence remains pending.'
  },null,2));
} finally {
  if (restored) await restored.end({timeout:3});
  try {
    await source.unsafe(`DROP DATABASE IF EXISTS ${restoreDb} WITH (FORCE)`);
  } catch {}
  await source.end({timeout:3});
  await rm(dumpPath,{force:true});
}
