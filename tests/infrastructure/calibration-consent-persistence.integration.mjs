import assert from 'node:assert/strict';
import fs from 'node:fs';
import postgres from 'postgres';

const databaseUrl=process.env.DATABASE_URL;
assert.ok(databaseUrl,'DATABASE_URL is required');
const consent=JSON.parse(fs.readFileSync('data/calibration/consent-purpose-v0.1-dev.json','utf8'));
const sql=postgres(databaseUrl,{max:1,connect_timeout:10,idle_timeout:5});

async function expectDbFailure(label,fn,pattern) {
  try {
    await fn();
  } catch (error) {
    const message=error instanceof Error ? error.message : String(error);
    assert.match(message,pattern,`${label}: unexpected error: ${message}`);
    return;
  }
  assert.fail(`${label}: expected database operation to fail`);
}

try {
  assert.equal(consent.collection_authorized,false);
  assert.equal(consent.export_authorized,false);

  const [mismatchSession]=await sql`
    INSERT INTO anonymous_sessions
      (access_token_hash,model_version,locale,expires_at)
    VALUES
      (${'6'.repeat(64)},'assessment-dev-v0.3','ja-JP',now()+interval '1 hour')
    RETURNING session_id
  `;

  await expectDbFailure(
    'consent model mismatch',
    ()=>sql`
      INSERT INTO calibration_consent_receipts
        (session_id,assessment_model_version,consent_version,purpose_id,locale)
      VALUES
        (${mismatchSession.session_id},'assessment-dev-v0.2',${consent.consent_version},${consent.purpose_id},'ja-JP')
    `,
    /model\/locale must match owning session/i
  );

  await sql`DELETE FROM anonymous_sessions WHERE session_id=${mismatchSession.session_id}`;

  const [session]=await sql`
    INSERT INTO anonymous_sessions
      (access_token_hash,model_version,locale,expires_at)
    VALUES
      (${'7'.repeat(64)},'assessment-dev-v0.3','ja-JP',now()+interval '1 hour')
    RETURNING session_id
  `;

  const [receipt]=await sql`
    INSERT INTO calibration_consent_receipts
      (session_id,assessment_model_version,consent_version,purpose_id,locale)
    VALUES
      (${session.session_id},'assessment-dev-v0.3',${consent.consent_version},${consent.purpose_id},'ja-JP')
    RETURNING consent_receipt_id,status,withdrawn_at
  `;
  assert.ok(receipt?.consent_receipt_id);
  assert.equal(receipt.status,'granted');
  assert.equal(receipt.withdrawn_at,null);

  await expectDbFailure(
    'consent identity mutation',
    ()=>sql`
      UPDATE calibration_consent_receipts
      SET consent_version='calibration-consent-ja-v999-dev'
      WHERE consent_receipt_id=${receipt.consent_receipt_id}
    `,
    /identity is immutable/i
  );

  const [withdrawn]=await sql`
    UPDATE calibration_consent_receipts
    SET status='withdrawn',withdrawn_at=now(),updated_at=now()
    WHERE consent_receipt_id=${receipt.consent_receipt_id}
    RETURNING status,withdrawn_at
  `;
  assert.equal(withdrawn.status,'withdrawn');
  assert.ok(withdrawn.withdrawn_at);

  await expectDbFailure(
    'withdrawn receipt re-grant',
    ()=>sql`
      UPDATE calibration_consent_receipts
      SET status='granted',withdrawn_at=null,updated_at=now()
      WHERE consent_receipt_id=${receipt.consent_receipt_id}
    `,
    /withdrawn calibration consent receipt is immutable/i
  );

  await sql`DELETE FROM anonymous_sessions WHERE session_id=${session.session_id}`;
  const [{remaining}]=await sql`
    SELECT count(*)::int AS remaining
    FROM calibration_consent_receipts
    WHERE consent_receipt_id=${receipt.consent_receipt_id}
  `;
  assert.equal(remaining,0,'owner session deletion must cascade consent receipt');

  console.log('Calibration consent persistence integration passed: separate version/purpose receipt, session model/locale binding, immutable identity, withdrawal-only mutation and owner-session cascade are proven while collection/export remain disabled.');
} finally {
  await sql.end({timeout:5});
}
