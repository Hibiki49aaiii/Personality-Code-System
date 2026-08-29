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
  const [release]=await sql`
    SELECT
      model_version,item_bank_version,scoring_version,code_schema_version,
      interaction_version,content_version,trait_dictionary_version,locale
    FROM assessment_model_releases
    WHERE model_version='assessment-dev-v0.3'
  `;
  assert.ok(release,'assessment-dev-v0.3 must be seeded before retest integration');

  const [session]=await sql`
    INSERT INTO anonymous_sessions
      (access_token_hash,model_version,locale,expires_at)
    VALUES
      (${tokenHash(`session-${label}`)},${release.model_version},${release.locale},now()+interval '60 days')
    RETURNING session_id
  `;

  const [receipt]=await sql`
    INSERT INTO calibration_consent_receipts
      (session_id,assessment_model_version,consent_version,purpose_id,locale)
    VALUES
      (${session.session_id},${release.model_version},${consentVersion},${purposeId},${release.locale})
    RETURNING consent_receipt_id
  `;

  await sql`
    INSERT INTO assessment_answers
      (session_id,item_id,item_revision,locale,value)
    SELECT
      ${session.session_id},mi.item_id,mi.item_revision,mi.locale,3
    FROM assessment_model_items mi
    WHERE mi.model_version=${release.model_version}
  `;

  await sql`
    INSERT INTO assessment_trait_scores
      (session_id,trait_id,scoring_version,score_bp)
    SELECT DISTINCT
      ${session.session_id},mi.trait_id,${release.scoring_version},5000
    FROM assessment_model_items mi
    WHERE mi.model_version=${release.model_version}
  `;

  const snapshot={
    snapshotSchemaVersion:'result-snapshot-v0.1-dev',
    versions:{
      assessmentModelVersion:release.model_version,
      itemBankVersion:release.item_bank_version,
      scoringVersion:release.scoring_version,
      codeSchemaVersion:release.code_schema_version,
      interactionVersion:release.interaction_version,
      contentVersion:release.content_version
    },
    locale:release.locale
  };

  await sql`
    INSERT INTO result_snapshots
      (session_id,snapshot_schema_version,assessment_model_version,item_bank_version,
       scoring_version,code_schema_version,interaction_version,content_version,locale,snapshot_json)
    VALUES
      (${session.session_id},'result-snapshot-v0.1-dev',${release.model_version},${release.item_bank_version},
       ${release.scoring_version},${release.code_schema_version},${release.interaction_version},
       ${release.content_version},${release.locale},${sql.json(snapshot)})
  `;

  const [completed]=await sql`
    UPDATE anonymous_sessions
    SET
      status='completed',
      completed_at=now()+${completedOffsetDays}*interval '1 day',
      updated_at=now()
    WHERE session_id=${session.session_id}
    RETURNING completed_at
  `;
  assert.ok(completed?.completed_at);

  const [record]=await sql`
    INSERT INTO calibration_record_links (consent_receipt_id)
    VALUES (${receipt.consent_receipt_id})
    RETURNING calibration_record_id
  `;

  return {
    sessionId:session.session_id,
    consentReceiptId:receipt.consent_receipt_id,
    calibrationRecordId:record.calibration_record_id,
    completedAt:completed.completed_at,
    release
  };
}

async function insertIssuedPair({baseline,label}) {
  const [pair]=await sql`
    INSERT INTO calibration_retest_linkages
      (baseline_calibration_record_id,claim_token_hash,wave_id,assessment_model_version,
       item_bank_version,scoring_version,trait_dictionary_version,locale,eligible_from,eligible_until)
    VALUES
      (${baseline.calibrationRecordId},${tokenHash(`retest-${label}`)},
       'beta-ja-wave-01-draft','assessment-dev-v0.3','item-bank-v0.2',
       'scoring-v0.1-dev','trait-dictionary-v0.2','ja-JP',
       ${baseline.completedAt}::timestamptz+interval '14 days',
       ${baseline.completedAt}::timestamptz+interval '21 days')
    RETURNING retest_pair_id,status,eligible_from,eligible_until
  `;
  return pair;
}

try {
  const baseline=await createCompletedCalibrationRecord({
    label:'baseline-primary',
    consentVersion:'calibration-consent-ja-v0.1-dev',
    purposeId:'psychometric-calibration-v0.1',
    completedOffsetDays:-15
  });
  const retest=await createCompletedCalibrationRecord({
    label:'retest-primary',
    consentVersion:'calibration-retest-consent-ja-v0.1-dev',
    purposeId:'psychometric-calibration-retest-v0.1',
    completedOffsetDays:0
  });

  const pair=await insertIssuedPair({baseline,label:'primary'});
  assert.equal(pair.status,'issued');
  assert.equal(
    new Date(pair.eligible_until).getTime()-new Date(pair.eligible_from).getTime(),
    7*24*60*60*1000
  );

  const rawTokenBaseline=await createCompletedCalibrationRecord({
    label:'baseline-raw-token',
    consentVersion:'calibration-consent-ja-v0.1-dev',
    purposeId:'psychometric-calibration-v0.1',
    completedOffsetDays:-15
  });
  await expectDbFailure(
    'raw claim token persistence',
    ()=>sql`
      INSERT INTO calibration_retest_linkages
        (baseline_calibration_record_id,claim_token_hash,wave_id,assessment_model_version,
         item_bank_version,scoring_version,trait_dictionary_version,locale,eligible_from,eligible_until)
      VALUES
        (${rawTokenBaseline.calibrationRecordId},${'A'.repeat(43)},
         'beta-ja-wave-01-draft','assessment-dev-v0.3','item-bank-v0.2',
         'scoring-v0.1-dev','trait-dictionary-v0.2','ja-JP',
         ${rawTokenBaseline.completedAt}::timestamptz+interval '14 days',
         ${rawTokenBaseline.completedAt}::timestamptz+interval '21 days')
    `,
    /calibration_retest_claim_token_hash_chk|check constraint/i
  );

  await expectDbFailure(
    'duplicate baseline pair',
    ()=>insertIssuedPair({baseline,label:'duplicate-baseline'}),
    /calibration_retest_linkages_baseline_uq|duplicate key/i
  );

  const wrongWindowBaseline=await createCompletedCalibrationRecord({
    label:'baseline-wrong-window',
    consentVersion:'calibration-consent-ja-v0.1-dev',
    purposeId:'psychometric-calibration-v0.1',
    completedOffsetDays:-15
  });
  await expectDbFailure(
    'wrong eligibility window',
    ()=>sql`
      INSERT INTO calibration_retest_linkages
        (baseline_calibration_record_id,claim_token_hash,wave_id,assessment_model_version,
         item_bank_version,scoring_version,trait_dictionary_version,locale,eligible_from,eligible_until)
      VALUES
        (${wrongWindowBaseline.calibrationRecordId},${tokenHash('retest-wrong-window')},
         'beta-ja-wave-01-draft','assessment-dev-v0.3','item-bank-v0.2',
         'scoring-v0.1-dev','trait-dictionary-v0.2','ja-JP',
         ${wrongWindowBaseline.completedAt}::timestamptz+interval '13 days',
         ${wrongWindowBaseline.completedAt}::timestamptz+interval '20 days')
    `,
    /eligibility window mismatch/i
  );

  const wrongScopeBaseline=await createCompletedCalibrationRecord({
    label:'baseline-wrong-scope',
    consentVersion:'calibration-consent-ja-v0.1-dev',
    purposeId:'psychometric-calibration-v0.1',
    completedOffsetDays:-15
  });
  await expectDbFailure(
    'wrong frozen scope',
    ()=>sql`
      INSERT INTO calibration_retest_linkages
        (baseline_calibration_record_id,claim_token_hash,wave_id,assessment_model_version,
         item_bank_version,scoring_version,trait_dictionary_version,locale,eligible_from,eligible_until)
      VALUES
        (${wrongScopeBaseline.calibrationRecordId},${tokenHash('retest-wrong-scope')},
         'other-wave','assessment-dev-v0.3','item-bank-v0.2',
         'scoring-v0.1-dev','trait-dictionary-v0.2','ja-JP',
         ${wrongScopeBaseline.completedAt}::timestamptz+interval '14 days',
         ${wrongScopeBaseline.completedAt}::timestamptz+interval '21 days')
    `,
    /scope mismatch/i
  );

  await expectDbFailure(
    'same baseline and retest record',
    ()=>sql`
      UPDATE calibration_retest_linkages
      SET status='claimed',
          retest_calibration_record_id=${baseline.calibrationRecordId},
          claimed_at=now()
      WHERE retest_pair_id=${pair.retest_pair_id}
    `,
    /distinct_records|check constraint|claim lineage invalid/i
  );

  const [claimed]=await sql`
    UPDATE calibration_retest_linkages
    SET status='claimed',
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

  const oldBaseline=await createCompletedCalibrationRecord({
    label:'baseline-old',
    consentVersion:'calibration-consent-ja-v0.1-dev',
    purposeId:'psychometric-calibration-v0.1',
    completedOffsetDays:-40
  });
  const oldPair=await insertIssuedPair({baseline:oldBaseline,label:'old'});
  const lateRetest=await createCompletedCalibrationRecord({
    label:'retest-late',
    consentVersion:'calibration-retest-consent-ja-v0.1-dev',
    purposeId:'psychometric-calibration-retest-v0.1',
    completedOffsetDays:0
  });
  await expectDbFailure(
    'outside-window retest claim',
    ()=>sql`
      UPDATE calibration_retest_linkages
      SET status='claimed',
          retest_calibration_record_id=${lateRetest.calibrationRecordId},
          claimed_at=now()
      WHERE retest_pair_id=${oldPair.retest_pair_id}
    `,
    /outside eligibility window/i
  );

  const secondBaseline=await createCompletedCalibrationRecord({
    label:'baseline-second',
    consentVersion:'calibration-consent-ja-v0.1-dev',
    purposeId:'psychometric-calibration-v0.1',
    completedOffsetDays:-15
  });
  const secondPair=await insertIssuedPair({baseline:secondBaseline,label:'second'});
  await expectDbFailure(
    'duplicate retest membership',
    ()=>sql`
      UPDATE calibration_retest_linkages
      SET status='claimed',
          retest_calibration_record_id=${retest.calibrationRecordId},
          claimed_at=now()
      WHERE retest_pair_id=${secondPair.retest_pair_id}
    `,
    /calibration_retest_linkages_retest_uq|duplicate key/i
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
  assert.equal(deletionRows.length,2,'withdrawal must journal both linked record IDs');

  await sql`DELETE FROM anonymous_sessions WHERE session_id=${baseline.sessionId}`;
  const [{remaining_pair}]=await sql`
    SELECT count(*)::int AS remaining_pair
    FROM calibration_retest_linkages
    WHERE retest_pair_id=${pair.retest_pair_id}
  `;
  assert.equal(remaining_pair,0,'owner-session deletion must remove active linkage row via consent/record cascade');

  console.log('Calibration retest linkage integration passed: completed-session lineage, exact frozen scope, 14–21 day window, hash-only token storage, unique/different pair membership, claim immutability and pair-level withdrawal/deletion journaling are enforced while runtime collection/export remain absent.');
} finally {
  await sql.end({timeout:5});
}
