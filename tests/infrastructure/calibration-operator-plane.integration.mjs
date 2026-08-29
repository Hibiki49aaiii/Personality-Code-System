import assert from 'node:assert/strict';
import fs from 'node:fs';
import postgres from 'postgres';

const databaseUrl=process.env.DATABASE_URL;
assert.ok(databaseUrl,'DATABASE_URL is required');
const consent=JSON.parse(fs.readFileSync('data/calibration/consent-purpose-v0.1-dev.json','utf8'));
const wave=JSON.parse(fs.readFileSync('data/calibration/beta-wave-ja-01-draft.json','utf8'));
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
  const requesterHash='1'.repeat(64);
  const approverHash='2'.repeat(64);

  const [requester]=await sql`
    INSERT INTO calibration_operators (credential_hash)
    VALUES (${requesterHash})
    RETURNING operator_id,status
  `;
  const [approver]=await sql`
    INSERT INTO calibration_operators (credential_hash)
    VALUES (${approverHash})
    RETURNING operator_id,status
  `;
  assert.equal(requester.status,'active');
  assert.equal(approver.status,'active');

  const [unprivileged]=await sql`
    INSERT INTO calibration_operators (credential_hash)
    VALUES (${'4'.repeat(64)})
    RETURNING operator_id
  `;

  await expectDbFailure(
    'operator without requester role',
    ()=>sql`
      INSERT INTO calibration_export_requests
        (requester_operator_id,purpose_code,wave_id,export_schema_version,consent_version,
         assessment_model_version,item_bank_version,scoring_version,trait_dictionary_version,locale)
      VALUES
        (${unprivileged.operator_id},'wave-analysis',${wave.wave_id},'calibration-export-record-v0.1-dev',
         ${consent.consent_version},${wave.version_scope.assessment_model_version},
         ${wave.version_scope.item_bank_version},${wave.version_scope.scoring_version},
         ${wave.version_scope.trait_dictionary_version},${wave.locale})
    `,
    /lacks required role calibration-export-requester/i
  );

  await expectDbFailure(
    'duplicate operator credential hash',
    ()=>sql`INSERT INTO calibration_operators (credential_hash) VALUES (${requesterHash})`,
    /calibration_operators_credential_hash_uq|duplicate key/i
  );

  await sql`
    INSERT INTO calibration_operator_roles (operator_id,role)
    VALUES
      (${requester.operator_id},'calibration-export-requester'),
      (${approver.operator_id},'calibration-export-approver')
  `;

  const scope={
    purposeCode:'wave-analysis',
    waveId:wave.wave_id,
    exportSchemaVersion:'calibration-export-record-v0.1-dev',
    consentVersion:consent.consent_version,
    assessmentModelVersion:wave.version_scope.assessment_model_version,
    itemBankVersion:wave.version_scope.item_bank_version,
    scoringVersion:wave.version_scope.scoring_version,
    traitDictionaryVersion:wave.version_scope.trait_dictionary_version,
    locale:wave.locale
  };

  const [request]=await sql`
    INSERT INTO calibration_export_requests
      (requester_operator_id,purpose_code,wave_id,export_schema_version,consent_version,
       assessment_model_version,item_bank_version,scoring_version,trait_dictionary_version,locale)
    VALUES
      (${requester.operator_id},${scope.purposeCode},${scope.waveId},${scope.exportSchemaVersion},${scope.consentVersion},
       ${scope.assessmentModelVersion},${scope.itemBankVersion},${scope.scoringVersion},${scope.traitDictionaryVersion},${scope.locale})
    RETURNING request_id,status
  `;
  assert.equal(request.status,'requested');

  await expectDbFailure(
    'self approval',
    ()=>sql`
      UPDATE calibration_export_requests
      SET status='approved',approver_operator_id=${requester.operator_id},decided_at=now()
      WHERE request_id=${request.request_id}
    `,
    /distinct approver|distinct_operators|check constraint/i
  );

  const [approved]=await sql`
    UPDATE calibration_export_requests
    SET status='approved',approver_operator_id=${approver.operator_id},decided_at=now()
    WHERE request_id=${request.request_id}
    RETURNING status,approver_operator_id,decided_at
  `;
  assert.equal(approved.status,'approved');
  assert.equal(approved.approver_operator_id,approver.operator_id);
  assert.ok(approved.decided_at);

  await expectDbFailure(
    'export request delete',
    ()=>sql`DELETE FROM calibration_export_requests WHERE request_id=${request.request_id}`,
    /retained governance records/i
  );

  await expectDbFailure(
    'operator physical delete',
    ()=>sql`DELETE FROM calibration_operators WHERE operator_id=${unprivileged.operator_id}`,
    /must be revoked, not deleted/i
  );

  await expectDbFailure(
    'decided export request mutation',
    ()=>sql`
      UPDATE calibration_export_requests
      SET purpose_code='changed-purpose'
      WHERE request_id=${request.request_id}
    `,
    /scope\/requester is immutable|decided calibration export request is immutable/i
  );

  const [audit]=await sql`
    INSERT INTO calibration_operator_audit_events
      (action,requester_operator_id,approver_operator_id,purpose_code,wave_id,export_schema_version,
       consent_version,assessment_model_version,item_bank_version,scoring_version,trait_dictionary_version,
       locale,row_count,artifact_sha256,disposition)
    VALUES
      ('export-approved',${requester.operator_id},${approver.operator_id},${scope.purposeCode},${scope.waveId},
       ${scope.exportSchemaVersion},${scope.consentVersion},${scope.assessmentModelVersion},${scope.itemBankVersion},
       ${scope.scoringVersion},${scope.traitDictionaryVersion},${scope.locale},NULL,NULL,'approved')
    RETURNING audit_event_id
  `;
  assert.ok(audit.audit_event_id);

  await expectDbFailure(
    'audit update',
    ()=>sql`UPDATE calibration_operator_audit_events SET disposition='rejected' WHERE audit_event_id=${audit.audit_event_id}`,
    /append-only/i
  );
  await expectDbFailure(
    'audit delete',
    ()=>sql`DELETE FROM calibration_operator_audit_events WHERE audit_event_id=${audit.audit_event_id}`,
    /append-only/i
  );

  const [session]=await sql`
    INSERT INTO anonymous_sessions
      (access_token_hash,model_version,locale,expires_at)
    VALUES
      (${'3'.repeat(64)},${scope.assessmentModelVersion},${scope.locale},now()+interval '1 hour')
    RETURNING session_id
  `;
  const [receipt]=await sql`
    INSERT INTO calibration_consent_receipts
      (session_id,assessment_model_version,consent_version,purpose_id,locale)
    VALUES
      (${session.session_id},${scope.assessmentModelVersion},${consent.consent_version},${consent.purpose_id},${scope.locale})
    RETURNING consent_receipt_id
  `;
  const [link]=await sql`
    INSERT INTO calibration_record_links (consent_receipt_id)
    VALUES (${receipt.consent_receipt_id})
    RETURNING calibration_record_id
  `;
  assert.ok(link.calibration_record_id);

  await expectDbFailure(
    'active record link direct delete',
    ()=>sql`DELETE FROM calibration_record_links WHERE calibration_record_id=${link.calibration_record_id}`,
    /may only delete with its consent receipt/i
  );

  await expectDbFailure(
    'consent receipt direct delete',
    ()=>sql`DELETE FROM calibration_consent_receipts WHERE consent_receipt_id=${receipt.consent_receipt_id}`,
    /may only delete with owner session/i
  );

  await expectDbFailure(
    'record link mutation',
    ()=>sql`
      UPDATE calibration_record_links
      SET created_at=created_at+interval '1 second'
      WHERE calibration_record_id=${link.calibration_record_id}
    `,
    /record links are immutable/i
  );

  await sql`
    UPDATE calibration_consent_receipts
    SET status='withdrawn',withdrawn_at=now(),updated_at=now()
    WHERE consent_receipt_id=${receipt.consent_receipt_id}
  `;

  const withdrawalEvents=await sql`
    SELECT reason
    FROM calibration_deletion_events
    WHERE calibration_record_id=${link.calibration_record_id}
    ORDER BY reason
  `;
  assert.deepEqual(withdrawalEvents.map((row)=>row.reason),['consent-withdrawn']);

  await sql`DELETE FROM anonymous_sessions WHERE session_id=${session.session_id}`;

  const [{remainingLinks}]=await sql`
    SELECT count(*)::int AS "remainingLinks"
    FROM calibration_record_links
    WHERE calibration_record_id=${link.calibration_record_id}
  `;
  assert.equal(remainingLinks,0,'owner-session deletion must cascade active calibration record link');

  const deletionEvents=await sql`
    SELECT reason
    FROM calibration_deletion_events
    WHERE calibration_record_id=${link.calibration_record_id}
    ORDER BY reason
  `;
  assert.deepEqual(
    deletionEvents.map((row)=>row.reason),
    ['consent-withdrawn','owner-session-deleted']
  );

  await expectDbFailure(
    'deletion journal update',
    ()=>sql`
      UPDATE calibration_deletion_events
      SET reason='privacy-operator-purge'
      WHERE calibration_record_id=${link.calibration_record_id}
        AND reason='consent-withdrawn'
    `,
    /append-only/i
  );
  await expectDbFailure(
    'deletion journal delete',
    ()=>sql`
      DELETE FROM calibration_deletion_events
      WHERE calibration_record_id=${link.calibration_record_id}
    `,
    /append-only/i
  );

  const [revoked]=await sql`
    UPDATE calibration_operators
    SET status='revoked',revoked_at=now()
    WHERE operator_id=${requester.operator_id}
    RETURNING status,revoked_at
  `;
  assert.equal(revoked.status,'revoked');
  assert.ok(revoked.revoked_at);

  await expectDbFailure(
    'revoked operator mutation',
    ()=>sql`
      UPDATE calibration_operators
      SET status='active',revoked_at=NULL
      WHERE operator_id=${requester.operator_id}
    `,
    /revoked calibration operator is immutable/i
  );

  console.log('Calibration operator plane integration passed: hash-only operator identity, role binding, two-person approval, append-only audit, pseudonymous record linkage and withdrawal/session-deletion journal behavior are enforced while raw export remains absent.');
} finally {
  await sql.end({timeout:5});
}
