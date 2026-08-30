import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import process from 'node:process';
import postgres from 'postgres';

const databaseUrl=process.env.DATABASE_URL;
assert.ok(databaseUrl,'DATABASE_URL is required');

const sql=postgres(databaseUrl,{max:1,connect_timeout:10,idle_timeout:5});

function tokenHash(label) {
  return createHash('sha256').update(label,'utf8').digest('hex');
}

async function expectDbFailure(label,fn,pattern) {
  try {
    await fn();
  } catch (error) {
    const message=error instanceof Error ? error.message : String(error);
    assert.match(message,pattern,`${label}: unexpected database error: ${message}`);
    return;
  }
  assert.fail(`${label}: expected database operation to fail`);
}

async function createCompletedCalibrationRecord({
  label,
  consentVersion,
  purposeId,
  completedOffsetDays
}) {
  const [session]=await sql`
    INSERT INTO anonymous_sessions
      (access_token_hash,model_version,locale,status,expires_at,completed_at)
    VALUES
      (
        ${tokenHash(`session:${label}`)},
        'assessment-dev-v0.3',
        'ja-JP',
        'completed',
        now()+interval '30 days',
        now()+${completedOffsetDays}*interval '1 day'
      )
    RETURNING session_id
  `;

  const [receipt]=await sql`
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

  const [link]=await sql`
    INSERT INTO calibration_record_links (consent_receipt_id)
    VALUES (${receipt.consent_receipt_id})
    RETURNING calibration_record_id
  `;

  await sql`
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

  const inserted=await sql`
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

  const [record]=await sql`
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

async function createBaseline(label,completedOffsetDays=-15) {
  return createCompletedCalibrationRecord({
    label,
    consentVersion:'calibration-consent-ja-v0.1-dev',
    purposeId:'psychometric-calibration-v0.1',
    completedOffsetDays
  });
}

async function createRetest(label,completedOffsetDays=0) {
  return createCompletedCalibrationRecord({
    label,
    consentVersion:'calibration-retest-consent-ja-v0.1-dev',
    purposeId:'psychometric-calibration-retest-v0.1',
    completedOffsetDays
  });
}

async function insertIssuedPair({baseline,label}) {
  const [pair]=await sql`
    INSERT INTO calibration_retest_linkages
      (
        baseline_calibration_record_id,claim_token_hash,wave_id,assessment_model_version,
        item_bank_version,scoring_version,trait_dictionary_version,locale,
        eligible_from,eligible_until
      )
    VALUES
      (
        ${baseline.calibrationRecordId},
        ${tokenHash(`claim:${label}`)},
        'beta-ja-wave-01-draft',
        'assessment-dev-v0.3',
        'item-bank-v0.2',
        'scoring-v0.1-dev',
        'trait-dictionary-v0.2',
        'ja-JP',
        (SELECT completed_at + interval '14 days' FROM calibration_records WHERE calibration_record_id=${baseline.calibrationRecordId}),
        (SELECT completed_at + interval '21 days' FROM calibration_records WHERE calibration_record_id=${baseline.calibrationRecordId})
      )
    RETURNING *
  `;
  return pair;
}

try {
  const baseline=await createBaseline('baseline-primary',-15);
  const retest=await createRetest('retest-primary',0);

  const pair=await insertIssuedPair({baseline,label:'primary'});
  assert.equal(pair.status,'issued');
  assert.equal(pair.baseline_calibration_record_id,baseline.calibrationRecordId);
  assert.equal(
    new Date(pair.eligible_until).getTime()-new Date(pair.eligible_from).getTime(),
    7*24*60*60*1000
  );

  const rawTokenBaseline=await createBaseline('baseline-raw-token',-15);
  await expectDbFailure(
    'raw claim token persistence',
    ()=>sql`
      INSERT INTO calibration_retest_linkages
        (
          baseline_calibration_record_id,claim_token_hash,wave_id,assessment_model_version,
          item_bank_version,scoring_version,trait_dictionary_version,locale,
          eligible_from,eligible_until
        )
      VALUES
        (
          ${rawTokenBaseline.calibrationRecordId},
          ${'A'.repeat(43)},
          'beta-ja-wave-01-draft',
          'assessment-dev-v0.3',
          'item-bank-v0.2',
          'scoring-v0.1-dev',
          'trait-dictionary-v0.2',
          'ja-JP',
          (SELECT completed_at + interval '14 days' FROM calibration_records WHERE calibration_record_id=${rawTokenBaseline.calibrationRecordId}),
          (SELECT completed_at + interval '21 days' FROM calibration_records WHERE calibration_record_id=${rawTokenBaseline.calibrationRecordId})
        )
    `,
    /calibration_retest_claim_token_hash_chk|check constraint/i
  );

  await expectDbFailure(
    'duplicate baseline pair',
    ()=>insertIssuedPair({baseline,label:'duplicate-baseline'}),
    /calibration_retest_linkages_baseline_uq|duplicate key/i
  );

  const wrongWindowBaseline=await createBaseline('baseline-wrong-window',-15);
  await expectDbFailure(
    'wrong eligibility window',
    ()=>sql`
      INSERT INTO calibration_retest_linkages
        (
          baseline_calibration_record_id,claim_token_hash,wave_id,assessment_model_version,
          item_bank_version,scoring_version,trait_dictionary_version,locale,
          eligible_from,eligible_until
        )
      VALUES
        (
          ${wrongWindowBaseline.calibrationRecordId},
          ${tokenHash('claim:wrong-window')},
          'beta-ja-wave-01-draft',
          'assessment-dev-v0.3',
          'item-bank-v0.2',
          'scoring-v0.1-dev',
          'trait-dictionary-v0.2',
          'ja-JP',
          (SELECT completed_at + interval '13 days' FROM calibration_records WHERE calibration_record_id=${wrongWindowBaseline.calibrationRecordId}),
          (SELECT completed_at + interval '20 days' FROM calibration_records WHERE calibration_record_id=${wrongWindowBaseline.calibrationRecordId})
        )
    `,
    /eligibility window mismatch/i
  );

  const wrongScopeBaseline=await createBaseline('baseline-wrong-scope',-15);
  await expectDbFailure(
    'wrong frozen scope',
    ()=>sql`
      INSERT INTO calibration_retest_linkages
        (
          baseline_calibration_record_id,claim_token_hash,wave_id,assessment_model_version,
          item_bank_version,scoring_version,trait_dictionary_version,locale,
          eligible_from,eligible_until
        )
      VALUES
        (
          ${wrongScopeBaseline.calibrationRecordId},
          ${tokenHash('claim:wrong-scope')},
          'other-wave',
          'assessment-dev-v0.3',
          'item-bank-v0.2',
          'scoring-v0.1-dev',
          'trait-dictionary-v0.2',
          'ja-JP',
          (SELECT completed_at + interval '14 days' FROM calibration_records WHERE calibration_record_id=${wrongScopeBaseline.calibrationRecordId}),
          (SELECT completed_at + interval '21 days' FROM calibration_records WHERE calibration_record_id=${wrongScopeBaseline.calibrationRecordId})
        )
    `,
    /scope mismatch/i
  );

  await expectDbFailure(
    'same baseline and retest record',
    ()=>sql`
      UPDATE calibration_retest_linkages
      SET
        status='claimed',
        retest_calibration_record_id=${baseline.calibrationRecordId},
        claimed_at=now()
      WHERE retest_pair_id=${pair.retest_pair_id}
    `,
    /distinct_records|check constraint|claim record\/consent lineage invalid/i
  );

  const [claimed]=await sql`
    UPDATE calibration_retest_linkages
    SET
      status='claimed',
      retest_calibration_record_id=${retest.calibrationRecordId},
      claimed_at=now()
    WHERE retest_pair_id=${pair.retest_pair_id}
    RETURNING status,retest_calibration_record_id,claimed_at
  `;
  assert.equal(claimed.status,'claimed');
  assert.equal(claimed.retest_calibration_record_id,retest.calibrationRecordId);
  assert.ok(claimed.claimed_at);

  await expectDbFailure(
    'claimed pair second mutation',
    ()=>sql`
      UPDATE calibration_retest_linkages
      SET claimed_at=now()
      WHERE retest_pair_id=${pair.retest_pair_id}
    `,
    /update not allowed|invalid calibration retest claim transition/i
  );

  const oldBaseline=await createBaseline('baseline-old',-40);
  const oldPair=await insertIssuedPair({baseline:oldBaseline,label:'old'});
  const lateRetest=await createRetest('retest-late',0);
  await expectDbFailure(
    'outside-window retest claim',
    ()=>sql`
      UPDATE calibration_retest_linkages
      SET
        status='claimed',
        retest_calibration_record_id=${lateRetest.calibrationRecordId},
        claimed_at=now()
      WHERE retest_pair_id=${oldPair.retest_pair_id}
    `,
    /outside eligibility window/i
  );

  const secondBaseline=await createBaseline('baseline-second',-15);
  const secondPair=await insertIssuedPair({baseline:secondBaseline,label:'second'});
  await expectDbFailure(
    'duplicate retest membership',
    ()=>sql`
      UPDATE calibration_retest_linkages
      SET
        status='claimed',
        retest_calibration_record_id=${retest.calibrationRecordId},
        claimed_at=now()
      WHERE retest_pair_id=${secondPair.retest_pair_id}
    `,
    /calibration_retest_linkages_retest_uq|duplicate key/i
  );

  const badConsentSession=await sql`
    INSERT INTO anonymous_sessions
      (access_token_hash,model_version,locale,status,expires_at,completed_at)
    VALUES
      (
        ${tokenHash('session:bad-retest-consent')},
        'assessment-dev-v0.3',
        'ja-JP',
        'completed',
        now()+interval '30 days',
        now()
      )
    RETURNING session_id
  `;
  const [badReceipt]=await sql`
    INSERT INTO calibration_consent_receipts
      (session_id,assessment_model_version,consent_version,purpose_id,locale)
    VALUES
      (
        ${badConsentSession[0].session_id},
        'assessment-dev-v0.3',
        'calibration-retest-consent-ja-v0.1-dev',
        'psychometric-calibration-v0.1',
        'ja-JP'
      )
    RETURNING consent_receipt_id
  `;
  const [badLink]=await sql`
    INSERT INTO calibration_record_links (consent_receipt_id)
    VALUES (${badReceipt.consent_receipt_id})
    RETURNING calibration_record_id
  `;
  await expectDbFailure(
    'mismatched retest consent purpose cannot create calibration record',
    ()=>sql`
      INSERT INTO calibration_records
        (
          calibration_record_id,wave_id,assessment_model_version,item_bank_version,
          scoring_version,trait_dictionary_version,locale
        )
      VALUES
        (
          ${badLink.calibration_record_id},
          'beta-ja-wave-01-draft',
          'assessment-dev-v0.3',
          'item-bank-v0.2',
          'scoring-v0.1-dev',
          'trait-dictionary-v0.2',
          'ja-JP'
        )
    `,
    /matching granted consent/i
  );

  await sql`
    UPDATE calibration_consent_receipts
    SET status='withdrawn',withdrawn_at=now(),updated_at=now()
    WHERE consent_receipt_id=${baseline.consentReceiptId}
  `;

  const [invalidated]=await sql`
    SELECT status,invalidated_at
    FROM calibration_retest_linkages
    WHERE retest_pair_id=${pair.retest_pair_id}
  `;
  assert.equal(invalidated.status,'invalidated');
  assert.ok(invalidated.invalidated_at);

  const deletionRows=await sql`
    SELECT calibration_record_id,reason
    FROM calibration_deletion_events
    WHERE reason='retest-pair-invalidated'
      AND calibration_record_id IN (
        ${baseline.calibrationRecordId},
        ${retest.calibrationRecordId}
      )
    ORDER BY calibration_record_id
  `;
  assert.equal(deletionRows.length,2,'withdrawal must journal both linked calibration record IDs');

  await expectDbFailure(
    'pair invalidation event alone cannot delete partner record',
    ()=>sql`
      DELETE FROM calibration_records
      WHERE calibration_record_id=${retest.calibrationRecordId}
    `,
    /privacy deletion event|parent-link cascade/i
  );

  await sql`DELETE FROM anonymous_sessions WHERE session_id=${baseline.sessionId}`;
  const [{remaining_pair}]=await sql`
    SELECT count(*)::int AS remaining_pair
    FROM calibration_retest_linkages
    WHERE retest_pair_id=${pair.retest_pair_id}
  `;
  assert.equal(remaining_pair,0,'owner-session deletion must remove linkage through calibration record cascade');

  const [retestStillPresent]=await sql`
    SELECT count(*)::int AS count
    FROM calibration_records
    WHERE calibration_record_id=${retest.calibrationRecordId}
  `;
  assert.equal(retestStillPresent.count,1,'partner record remains until a future authorized purge processes the pair journal');

  console.log('Calibration retest linkage integration passed: completed purpose-separated calibration records, exact frozen scope, 14–21 day window, hash-only token storage, distinct consent identities, unique/different pair membership and pair-level withdrawal/deletion journaling are enforced while runtime collection/export remain absent.');
} finally {
  await sql.end({timeout:5});
}
