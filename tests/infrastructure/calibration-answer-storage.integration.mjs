import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import process from 'node:process';
import postgres from 'postgres';

const databaseUrl=process.env.DATABASE_URL;
assert.ok(databaseUrl,'DATABASE_URL is required');

const sql=postgres(databaseUrl,{max:1,connect_timeout:10,idle_timeout:5});

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

async function createConsentBoundRecordLink() {
  const tokenHash=randomBytes(32).toString('hex');
  const [session]=await sql`
    INSERT INTO anonymous_sessions
      (access_token_hash,model_version,locale,expires_at)
    VALUES
      (${tokenHash},'assessment-dev-v0.3','ja-JP',now()+interval '2 hours')
    RETURNING session_id
  `;
  assert.ok(session?.session_id);

  const [receipt]=await sql`
    INSERT INTO calibration_consent_receipts
      (session_id,assessment_model_version,consent_version,purpose_id,locale)
    VALUES
      (
        ${session.session_id},
        'assessment-dev-v0.3',
        'calibration-consent-ja-v0.1-dev',
        'psychometric-calibration-v0.1',
        'ja-JP'
      )
    RETURNING consent_receipt_id
  `;
  assert.ok(receipt?.consent_receipt_id);

  const [link]=await sql`
    INSERT INTO calibration_record_links (consent_receipt_id)
    VALUES (${receipt.consent_receipt_id})
    RETURNING calibration_record_id
  `;
  assert.ok(link?.calibration_record_id);

  return {
    sessionId:session.session_id,
    consentReceiptId:receipt.consent_receipt_id,
    calibrationRecordId:link.calibration_record_id
  };
}

async function insertExactRecord(calibrationRecordId) {
  await sql`
    INSERT INTO calibration_records
      (
        calibration_record_id,wave_id,assessment_model_version,item_bank_version,
        scoring_version,trait_dictionary_version,locale
      )
    VALUES
      (
        ${calibrationRecordId},
        'beta-ja-wave-01-draft',
        'assessment-dev-v0.3',
        'item-bank-v0.2',
        'scoring-v0.1-dev',
        'trait-dictionary-v0.2',
        'ja-JP'
      )
  `;
}

try {
  const [model]=await sql`
    SELECT model_version,status,locale,item_bank_version,scoring_version,trait_dictionary_version
    FROM assessment_model_releases
    WHERE model_version='assessment-dev-v0.3'
  `;
  assert.ok(model,'assessment-dev-v0.3 must be seeded before calibration storage integration');
  assert.ok(['beta','published'].includes(model.status));
  assert.equal(model.locale,'ja-JP');
  assert.equal(model.item_bank_version,'item-bank-v0.2');
  assert.equal(model.scoring_version,'scoring-v0.1-dev');
  assert.equal(model.trait_dictionary_version,'trait-dictionary-v0.2');

  const modelItems=await sql`
    SELECT position,item_id,item_revision,locale
    FROM assessment_model_items
    WHERE model_version='assessment-dev-v0.3'
    ORDER BY position
  `;
  assert.equal(modelItems.length,147,'Wave JA-01 storage contract requires exact 147-item model');

  await expectDbFailure(
    'beta assessment model demotion',
    ()=>sql`
      UPDATE assessment_model_releases
      SET status='draft'
      WHERE model_version='assessment-dev-v0.3'
    `,
    /may only transition to published or retired/i
  );

  await expectDbFailure(
    'beta assessment model tuple mutation',
    ()=>sql`
      UPDATE assessment_model_releases
      SET scoring_version='scoring-v0.1-dev-drift-fixture'
      WHERE model_version='assessment-dev-v0.3'
    `,
    /immutable version tuple/i
  );

  await expectDbFailure(
    'beta assessment model mapping mutation',
    ()=>sql`
      UPDATE assessment_model_items
      SET weight_milli=weight_milli+1
      WHERE model_version='assessment-dev-v0.3'
        AND position=1
    `,
    /items belonging to a beta assessment model are immutable/i
  );

  const primary=await createConsentBoundRecordLink();

  await expectDbFailure(
    'wrong Wave/model scope',
    ()=>sql`
      INSERT INTO calibration_records
        (
          calibration_record_id,wave_id,assessment_model_version,item_bank_version,
          scoring_version,trait_dictionary_version,locale
        )
      VALUES
        (
          ${primary.calibrationRecordId},
          'beta-ja-wave-01-draft',
          'assessment-dev-v0.2',
          'item-bank-v0.2',
          'scoring-v0.1-dev',
          'trait-dictionary-v0.2',
          'ja-JP'
        )
    `,
    /scope mismatch/i
  );

  await insertExactRecord(primary.calibrationRecordId);

  await expectDbFailure(
    'invalid Likert response',
    ()=>sql`
      INSERT INTO calibration_item_responses
        (calibration_record_id,item_id,item_revision,locale,value)
      VALUES
        (
          ${primary.calibrationRecordId},
          ${modelItems[0].item_id},
          ${modelItems[0].item_revision},
          ${modelItems[0].locale},
          6
        )
    `,
    /calibration_item_response_value_chk|violates check constraint/i
  );

  await expectDbFailure(
    'off-model response item',
    ()=>sql`
      INSERT INTO calibration_item_responses
        (calibration_record_id,item_id,item_revision,locale,value)
      VALUES
        (
          ${primary.calibrationRecordId},
          'PCS-SYS-999',
          'r1',
          'ja-JP',
          3
        )
    `,
    /not part of the record assessment model/i
  );

  const first=modelItems[0];
  const alternateRevision='cal-storage-test-alt';
  await sql`
    INSERT INTO assessment_item_revisions
      (item_id,revision,locale,text,rationale,lifecycle_status,introduced_item_bank_version)
    VALUES
      (
        ${first.item_id},
        ${alternateRevision},
        ${first.locale},
        'calibration storage alternate revision fixture',
        'integration-only revision mismatch fixture',
        'reviewed',
        'item-bank-v0.2'
      )
    ON CONFLICT (item_id,revision,locale) DO NOTHING
  `;

  await expectDbFailure(
    'wrong item revision',
    ()=>sql`
      INSERT INTO calibration_item_responses
        (calibration_record_id,item_id,item_revision,locale,value)
      VALUES
        (
          ${primary.calibrationRecordId},
          ${first.item_id},
          ${alternateRevision},
          ${first.locale},
          3
        )
    `,
    /revision\/locale mismatch/i
  );

  for (const item of modelItems) {
    await sql`
      INSERT INTO calibration_item_responses
        (calibration_record_id,item_id,item_revision,locale,value)
      VALUES
        (
          ${primary.calibrationRecordId},
          ${item.item_id},
          ${item.item_revision},
          ${item.locale},
          3
        )
    `;
  }

  await expectDbFailure(
    'duplicate response',
    ()=>sql`
      INSERT INTO calibration_item_responses
        (calibration_record_id,item_id,item_revision,locale,value)
      VALUES
        (
          ${primary.calibrationRecordId},
          ${first.item_id},
          ${first.item_revision},
          ${first.locale},
          3
        )
    `,
    /duplicate key|unique constraint|calibration_item_responses_pkey/i
  );

  const incomplete=await createConsentBoundRecordLink();
  await insertExactRecord(incomplete.calibrationRecordId);
  await sql`
    INSERT INTO calibration_item_responses
      (calibration_record_id,item_id,item_revision,locale,value)
    VALUES
      (
        ${incomplete.calibrationRecordId},
        ${first.item_id},
        ${first.item_revision},
        ${first.locale},
        3
      )
  `;
  await expectDbFailure(
    'incomplete finalize',
    ()=>sql`SELECT public.pcs_finalize_calibration_record(${incomplete.calibrationRecordId})`,
    /incomplete|missing model responses/i
  );

  let rollbackFixtureSeen=false;
  try {
    await sql.begin(async (tx)=>{
      await tx`
        UPDATE assessment_model_releases
        SET status='retired'
        WHERE model_version='assessment-dev-v0.3'
      `;

      await expectDbFailure(
        'retired assessment model mapping mutation',
        ()=>tx.savepoint((sp)=>sp`
          UPDATE assessment_model_items
          SET weight_milli=weight_milli+1
          WHERE model_version='assessment-dev-v0.3'
            AND position=1
        `),
        /items belonging to a retired assessment model are immutable/i
      );

      await expectDbFailure(
        'finalize after beta release retirement',
        ()=>tx.savepoint((sp)=>sp`
          SELECT public.pcs_finalize_calibration_record(${primary.calibrationRecordId})
        `),
        /completion release tuple mismatch/i
      );

      throw new Error('ROLLBACK_RELEASE_RETIREMENT_FIXTURE');
    });
  } catch (error) {
    assert.equal(
      error instanceof Error ? error.message : String(error),
      'ROLLBACK_RELEASE_RETIREMENT_FIXTURE'
    );
    rollbackFixtureSeen=true;
  }
  assert.equal(rollbackFixtureSeen,true);

  const [restoredRelease]=await sql`
    SELECT status,scoring_version
    FROM assessment_model_releases
    WHERE model_version='assessment-dev-v0.3'
  `;
  assert.deepEqual(
    restoredRelease,
    {status:'beta',scoring_version:'scoring-v0.1-dev'},
    'retirement fixture must rollback completely'
  );

  await sql`SELECT public.pcs_finalize_calibration_record(${primary.calibrationRecordId})`;

  const [complete]=await sql`
    SELECT status,completed_at
    FROM calibration_records
    WHERE calibration_record_id=${primary.calibrationRecordId}
  `;
  assert.equal(complete.status,'complete');
  assert.ok(complete.completed_at);

  await expectDbFailure(
    'completed response update',
    ()=>sql`
      UPDATE calibration_item_responses
      SET value=4
      WHERE calibration_record_id=${primary.calibrationRecordId}
        AND item_id=${first.item_id}
    `,
    /calibration item responses are immutable/i
  );
  await expectDbFailure(
    'direct response delete',
    ()=>sql`
      DELETE FROM calibration_item_responses
      WHERE calibration_record_id=${primary.calibrationRecordId}
        AND item_id=${first.item_id}
    `,
    /may only delete with their parent record/i
  );
  await expectDbFailure(
    'completed record mutation',
    ()=>sql`
      UPDATE calibration_records
      SET locale='en-US'
      WHERE calibration_record_id=${primary.calibrationRecordId}
    `,
    /completed calibration record is immutable/i
  );
  await expectDbFailure(
    'direct calibration record delete',
    ()=>sql`
      DELETE FROM calibration_records
      WHERE calibration_record_id=${primary.calibrationRecordId}
    `,
    /requires a privacy deletion event or parent-link cascade/i
  );

  await sql`
    UPDATE calibration_consent_receipts
    SET status='withdrawn',withdrawn_at=now(),updated_at=now()
    WHERE consent_receipt_id=${primary.consentReceiptId}
  `;

  const [withdrawalEvent]=await sql`
    SELECT reason
    FROM calibration_deletion_events
    WHERE calibration_record_id=${primary.calibrationRecordId}
      AND reason='consent-withdrawn'
  `;
  assert.equal(withdrawalEvent?.reason,'consent-withdrawn');

  const [stillStored]=await sql`
    SELECT
      (SELECT count(*)::int FROM calibration_records WHERE calibration_record_id=${primary.calibrationRecordId}) AS record_count,
      (SELECT count(*)::int FROM calibration_item_responses WHERE calibration_record_id=${primary.calibrationRecordId}) AS response_count
  `;
  assert.equal(stillStored.record_count,1,'withdrawal must journal deletion without silently auto-purging before the reviewed purge workflow');
  assert.equal(stillStored.response_count,147);

  const journalAuthorizedDelete=await sql`
    DELETE FROM calibration_records
    WHERE calibration_record_id=${primary.calibrationRecordId}
    RETURNING calibration_record_id
  `;
  assert.equal(
    journalAuthorizedDelete.length,
    1,
    'privacy journal must remain sufficient for the controlled purge path to remove the record'
  );
  const [afterJournalDelete]=await sql`
    SELECT count(*)::int AS response_count
    FROM calibration_item_responses
    WHERE calibration_record_id=${primary.calibrationRecordId}
  `;
  assert.equal(afterJournalDelete.response_count,0,'record-level privacy deletion must cascade item responses');

  const withdrawnDraft=await createConsentBoundRecordLink();
  await insertExactRecord(withdrawnDraft.calibrationRecordId);
  await sql`
    UPDATE calibration_consent_receipts
    SET status='withdrawn',withdrawn_at=now(),updated_at=now()
    WHERE consent_receipt_id=${withdrawnDraft.consentReceiptId}
  `;
  await expectDbFailure(
    'withdrawn consent blocks further response insert',
    ()=>sql`
      INSERT INTO calibration_item_responses
        (calibration_record_id,item_id,item_revision,locale,value)
      VALUES
        (
          ${withdrawnDraft.calibrationRecordId},
          ${first.item_id},
          ${first.item_revision},
          ${first.locale},
          3
        )
    `,
    /require granted consent/i
  );

  const concurrentWithdrawal=await createConsentBoundRecordLink();
  await insertExactRecord(concurrentWithdrawal.calibrationRecordId);

  const withdrawalSql=postgres(databaseUrl,{max:1,connect_timeout:10,idle_timeout:5});
  const writerSql=postgres(databaseUrl,{max:1,connect_timeout:10,idle_timeout:5});
  let pendingWrite;
  let writerSettled=false;
  try {
    await withdrawalSql.begin(async (tx)=>{
      await tx`
        UPDATE calibration_consent_receipts
        SET status='withdrawn',withdrawn_at=now(),updated_at=now()
        WHERE consent_receipt_id=${concurrentWithdrawal.consentReceiptId}
      `;

      pendingWrite=writerSql`
        INSERT INTO calibration_item_responses
          (calibration_record_id,item_id,item_revision,locale,value)
        VALUES
          (
            ${concurrentWithdrawal.calibrationRecordId},
            ${first.item_id},
            ${first.item_revision},
            ${first.locale},
            3
          )
      `.then(
        ()=>({ok:true,error:null}),
        (error)=>({ok:false,error})
      ).finally(()=>{
        writerSettled=true;
      });

      await new Promise((resolve)=>setTimeout(resolve,120));
      assert.equal(
        writerSettled,
        false,
        'response insert must wait on the consent receipt row while withdrawal is uncommitted'
      );
    });

    const writeResult=await pendingWrite;
    assert.equal(writeResult.ok,false,'writer must fail after concurrent withdrawal commits');
    assert.match(
      writeResult.error instanceof Error ? writeResult.error.message : String(writeResult.error),
      /calibration responses require granted consent/i
    );
  } finally {
    await withdrawalSql.end({timeout:5});
    await writerSql.end({timeout:5});
  }

  const [concurrentStored]=await sql`
    SELECT count(*)::int AS response_count
    FROM calibration_item_responses
    WHERE calibration_record_id=${concurrentWithdrawal.calibrationRecordId}
  `;
  assert.equal(
    concurrentStored.response_count,
    0,
    'no response may commit after the withdrawal transaction wins the consent-row lock'
  );

  const withdrawnBeforeRecord=await createConsentBoundRecordLink();
  await sql`
    UPDATE calibration_consent_receipts
    SET status='withdrawn',withdrawn_at=now(),updated_at=now()
    WHERE consent_receipt_id=${withdrawnBeforeRecord.consentReceiptId}
  `;
  await expectDbFailure(
    'withdrawn consent record creation',
    ()=>insertExactRecord(withdrawnBeforeRecord.calibrationRecordId),
    /matching granted consent/i
  );

  await sql`DELETE FROM anonymous_sessions WHERE session_id=${primary.sessionId}`;

  const [afterCascade]=await sql`
    SELECT
      (SELECT count(*)::int FROM calibration_record_links WHERE calibration_record_id=${primary.calibrationRecordId}) AS link_count,
      (SELECT count(*)::int FROM calibration_records WHERE calibration_record_id=${primary.calibrationRecordId}) AS record_count,
      (SELECT count(*)::int FROM calibration_item_responses WHERE calibration_record_id=${primary.calibrationRecordId}) AS response_count
  `;
  assert.deepEqual(afterCascade,{link_count:0,record_count:0,response_count:0});

  const deletionReasons=await sql`
    SELECT reason
    FROM calibration_deletion_events
    WHERE calibration_record_id=${primary.calibrationRecordId}
    ORDER BY reason
  `;
  assert.deepEqual(
    deletionReasons.map((row)=>row.reason),
    ['consent-withdrawn','owner-session-deleted']
  );

  await sql`DELETE FROM anonymous_sessions WHERE session_id=${incomplete.sessionId}`;

  const [incompleteAfterOwnerCascade]=await sql`
    SELECT
      (SELECT count(*)::int FROM calibration_record_links WHERE calibration_record_id=${incomplete.calibrationRecordId}) AS link_count,
      (SELECT count(*)::int FROM calibration_records WHERE calibration_record_id=${incomplete.calibrationRecordId}) AS record_count,
      (SELECT count(*)::int FROM calibration_item_responses WHERE calibration_record_id=${incomplete.calibrationRecordId}) AS response_count,
      (SELECT count(*)::int FROM calibration_deletion_events
        WHERE calibration_record_id=${incomplete.calibrationRecordId}
          AND reason='owner-session-deleted') AS deletion_event_count
  `;
  assert.deepEqual(
    incompleteAfterOwnerCascade,
    {link_count:0,record_count:0,response_count:0,deletion_event_count:1},
    'owner-session deletion must journal then cascade a still-stored calibration record and its response rows'
  );

  await sql`DELETE FROM anonymous_sessions WHERE session_id=${withdrawnDraft.sessionId}`;
  await sql`DELETE FROM anonymous_sessions WHERE session_id=${concurrentWithdrawal.sessionId}`;
  await sql`DELETE FROM anonymous_sessions WHERE session_id=${withdrawnBeforeRecord.sessionId}`;

  console.log('Calibration answer storage integration passed: exact Wave JA-01 consent/model/item constraints, 147-response finalization, immutability, withdrawal journaling and owner-session parent privacy cascade are enforced while no runtime ingest path exists.');
} finally {
  await sql.end({timeout:5});
}
