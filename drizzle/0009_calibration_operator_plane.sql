BEGIN;

CREATE TABLE calibration_operators (
  operator_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_hash char(64) NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT calibration_operator_credential_hash_chk
    CHECK (credential_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT calibration_operator_status_chk
    CHECK (status IN ('active','revoked')),
  CONSTRAINT calibration_operator_revocation_chk
    CHECK (
      (status = 'active' AND revoked_at IS NULL)
      OR
      (status = 'revoked' AND revoked_at IS NOT NULL)
    )
);

CREATE UNIQUE INDEX calibration_operators_credential_hash_uq
  ON calibration_operators(credential_hash);

CREATE TABLE calibration_operator_roles (
  operator_id uuid NOT NULL REFERENCES calibration_operators(operator_id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (operator_id, role),
  CONSTRAINT calibration_operator_role_chk
    CHECK (
      role IN (
        'calibration-export-requester',
        'calibration-export-approver',
        'calibration-privacy-operator',
        'calibration-reviewer'
      )
    )
);

CREATE TABLE calibration_export_requests (
  request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_operator_id uuid NOT NULL REFERENCES calibration_operators(operator_id) ON DELETE RESTRICT,
  approver_operator_id uuid REFERENCES calibration_operators(operator_id) ON DELETE RESTRICT,
  purpose_code text NOT NULL,
  wave_id text NOT NULL,
  export_schema_version text NOT NULL,
  consent_version text NOT NULL,
  assessment_model_version text NOT NULL REFERENCES assessment_model_releases(model_version) ON DELETE RESTRICT,
  item_bank_version text NOT NULL,
  scoring_version text NOT NULL,
  trait_dictionary_version text NOT NULL,
  locale text NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  CONSTRAINT calibration_export_request_purpose_chk
    CHECK (purpose_code ~ '^[a-z][a-z0-9-]{2,63}$'),
  CONSTRAINT calibration_export_request_status_chk
    CHECK (status IN ('requested','approved','rejected')),
  CONSTRAINT calibration_export_request_distinct_operators_chk
    CHECK (approver_operator_id IS NULL OR approver_operator_id <> requester_operator_id),
  CONSTRAINT calibration_export_request_decision_chk
    CHECK (
      (status = 'requested' AND approver_operator_id IS NULL AND decided_at IS NULL)
      OR
      (status IN ('approved','rejected') AND approver_operator_id IS NOT NULL AND decided_at IS NOT NULL)
    )
);

CREATE INDEX calibration_export_requests_status_requested_idx
  ON calibration_export_requests(status, requested_at);

CREATE TABLE calibration_operator_audit_events (
  audit_event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  requester_operator_id uuid NOT NULL REFERENCES calibration_operators(operator_id) ON DELETE RESTRICT,
  approver_operator_id uuid NOT NULL REFERENCES calibration_operators(operator_id) ON DELETE RESTRICT,
  purpose_code text NOT NULL,
  wave_id text NOT NULL,
  export_schema_version text NOT NULL,
  consent_version text NOT NULL,
  assessment_model_version text NOT NULL REFERENCES assessment_model_releases(model_version) ON DELETE RESTRICT,
  item_bank_version text NOT NULL,
  scoring_version text NOT NULL,
  trait_dictionary_version text NOT NULL,
  locale text NOT NULL,
  row_count integer,
  artifact_sha256 char(64),
  disposition text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calibration_operator_audit_action_chk
    CHECK (
      action IN (
        'export-approved',
        'export-rejected',
        'privacy-purge-requested',
        'privacy-purge-confirmed'
      )
    ),
  CONSTRAINT calibration_operator_audit_distinct_operators_chk
    CHECK (requester_operator_id <> approver_operator_id),
  CONSTRAINT calibration_operator_audit_purpose_chk
    CHECK (purpose_code ~ '^[a-z][a-z0-9-]{2,63}$'),
  CONSTRAINT calibration_operator_audit_row_count_chk
    CHECK (row_count IS NULL OR row_count >= 0),
  CONSTRAINT calibration_operator_audit_artifact_hash_chk
    CHECK (artifact_sha256 IS NULL OR artifact_sha256 ~ '^[a-f0-9]{64}$'),
  CONSTRAINT calibration_operator_audit_disposition_chk
    CHECK (disposition IN ('approved','rejected','purge-pending','purged'))
);

CREATE INDEX calibration_operator_audit_events_occurred_idx
  ON calibration_operator_audit_events(occurred_at);

CREATE TABLE calibration_record_links (
  calibration_record_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_receipt_id uuid NOT NULL
    REFERENCES calibration_consent_receipts(consent_receipt_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX calibration_record_links_consent_receipt_uq
  ON calibration_record_links(consent_receipt_id);

CREATE TABLE calibration_deletion_events (
  deletion_event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calibration_record_id uuid NOT NULL,
  reason text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calibration_deletion_event_reason_chk
    CHECK (reason IN ('consent-withdrawn','owner-session-deleted','privacy-operator-purge'))
);

CREATE UNIQUE INDEX calibration_deletion_events_record_reason_uq
  ON calibration_deletion_events(calibration_record_id, reason);

CREATE INDEX calibration_deletion_events_occurred_idx
  ON calibration_deletion_events(occurred_at);

CREATE OR REPLACE FUNCTION pcs_validate_calibration_operator_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.operator_id <> OLD.operator_id
     OR NEW.credential_hash <> OLD.credential_hash
     OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'calibration operator identity is immutable';
  END IF;

  IF OLD.status = 'revoked' THEN
    RAISE EXCEPTION 'revoked calibration operator is immutable';
  END IF;

  IF NEW.status <> 'revoked' OR NEW.revoked_at IS NULL THEN
    RAISE EXCEPTION 'calibration operator update may only revoke credential';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER calibration_operators_update_guard
BEFORE UPDATE ON calibration_operators
FOR EACH ROW EXECUTE FUNCTION pcs_validate_calibration_operator_update();

CREATE OR REPLACE FUNCTION pcs_reject_calibration_operator_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'calibration operators must be revoked, not deleted';
END;
$$;

CREATE TRIGGER calibration_operators_delete_guard
BEFORE DELETE ON calibration_operators
FOR EACH ROW EXECUTE FUNCTION pcs_reject_calibration_operator_delete();

CREATE OR REPLACE FUNCTION pcs_require_active_calibration_operator_role(
  target_operator_id uuid,
  required_role text
)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  operator_status text;
  role_exists boolean;
BEGIN
  SELECT status
    INTO operator_status
  FROM calibration_operators
  WHERE operator_id = target_operator_id;

  IF operator_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'calibration operator must be active';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM calibration_operator_roles
    WHERE operator_id = target_operator_id
      AND role = required_role
  )
  INTO role_exists;

  IF role_exists IS NOT TRUE THEN
    RAISE EXCEPTION 'calibration operator lacks required role %', required_role;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION pcs_validate_calibration_export_request_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pcs_require_active_calibration_operator_role(
    NEW.requester_operator_id,
    'calibration-export-requester'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER calibration_export_requests_insert_guard
BEFORE INSERT ON calibration_export_requests
FOR EACH ROW EXECUTE FUNCTION pcs_validate_calibration_export_request_insert();

CREATE OR REPLACE FUNCTION pcs_validate_calibration_export_request_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.request_id <> OLD.request_id
     OR NEW.requester_operator_id <> OLD.requester_operator_id
     OR NEW.purpose_code <> OLD.purpose_code
     OR NEW.wave_id <> OLD.wave_id
     OR NEW.export_schema_version <> OLD.export_schema_version
     OR NEW.consent_version <> OLD.consent_version
     OR NEW.assessment_model_version <> OLD.assessment_model_version
     OR NEW.item_bank_version <> OLD.item_bank_version
     OR NEW.scoring_version <> OLD.scoring_version
     OR NEW.trait_dictionary_version <> OLD.trait_dictionary_version
     OR NEW.locale <> OLD.locale
     OR NEW.requested_at <> OLD.requested_at THEN
    RAISE EXCEPTION 'calibration export request scope/requester is immutable';
  END IF;

  IF OLD.status <> 'requested' THEN
    RAISE EXCEPTION 'decided calibration export request is immutable';
  END IF;

  IF NEW.status NOT IN ('approved','rejected')
     OR NEW.approver_operator_id IS NULL
     OR NEW.approver_operator_id = NEW.requester_operator_id
     OR NEW.decided_at IS NULL THEN
    RAISE EXCEPTION 'calibration export request decision requires a distinct approver';
  END IF;

  PERFORM pcs_require_active_calibration_operator_role(
    OLD.requester_operator_id,
    'calibration-export-requester'
  );
  PERFORM pcs_require_active_calibration_operator_role(
    NEW.approver_operator_id,
    'calibration-export-approver'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER calibration_export_requests_update_guard
BEFORE UPDATE ON calibration_export_requests
FOR EACH ROW EXECUTE FUNCTION pcs_validate_calibration_export_request_update();

CREATE OR REPLACE FUNCTION pcs_reject_calibration_export_request_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'calibration export requests are retained governance records';
END;
$$;

CREATE TRIGGER calibration_export_requests_delete_guard
BEFORE DELETE ON calibration_export_requests
FOR EACH ROW EXECUTE FUNCTION pcs_reject_calibration_export_request_delete();

CREATE OR REPLACE FUNCTION pcs_validate_calibration_audit_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.action IN ('export-approved','export-rejected') THEN
    PERFORM pcs_require_active_calibration_operator_role(
      NEW.requester_operator_id,
      'calibration-export-requester'
    );
    PERFORM pcs_require_active_calibration_operator_role(
      NEW.approver_operator_id,
      'calibration-export-approver'
    );
  ELSE
    PERFORM pcs_require_active_calibration_operator_role(
      NEW.requester_operator_id,
      'calibration-privacy-operator'
    );
    PERFORM pcs_require_active_calibration_operator_role(
      NEW.approver_operator_id,
      'calibration-reviewer'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER calibration_operator_audit_events_insert_guard
BEFORE INSERT ON calibration_operator_audit_events
FOR EACH ROW EXECUTE FUNCTION pcs_validate_calibration_audit_insert();

CREATE OR REPLACE FUNCTION pcs_reject_calibration_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'calibration operator audit events are append-only';
END;
$$;

CREATE TRIGGER calibration_operator_audit_events_append_only
BEFORE UPDATE OR DELETE ON calibration_operator_audit_events
FOR EACH ROW EXECUTE FUNCTION pcs_reject_calibration_audit_mutation();

CREATE OR REPLACE FUNCTION pcs_validate_calibration_record_link_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  consent_status text;
BEGIN
  SELECT status
    INTO consent_status
  FROM calibration_consent_receipts
  WHERE consent_receipt_id = NEW.consent_receipt_id;

  IF consent_status IS DISTINCT FROM 'granted' THEN
    RAISE EXCEPTION 'calibration record link requires granted consent';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER calibration_record_links_insert_guard
BEFORE INSERT ON calibration_record_links
FOR EACH ROW EXECUTE FUNCTION pcs_validate_calibration_record_link_insert();

CREATE OR REPLACE FUNCTION pcs_reject_calibration_record_link_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'calibration record links are immutable';
END;
$$;

CREATE TRIGGER calibration_record_links_immutable_update
BEFORE UPDATE ON calibration_record_links
FOR EACH ROW EXECUTE FUNCTION pcs_reject_calibration_record_link_update();

CREATE OR REPLACE FUNCTION pcs_validate_calibration_record_link_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  parent_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM calibration_consent_receipts
    WHERE consent_receipt_id = OLD.consent_receipt_id
  )
  INTO parent_exists;

  IF parent_exists THEN
    RAISE EXCEPTION 'calibration record link may only delete with its consent receipt';
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER calibration_record_links_delete_guard
BEFORE DELETE ON calibration_record_links
FOR EACH ROW EXECUTE FUNCTION pcs_validate_calibration_record_link_delete();

CREATE OR REPLACE FUNCTION pcs_reject_calibration_deletion_event_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'calibration deletion events are append-only';
END;
$$;

CREATE TRIGGER calibration_deletion_events_append_only
BEFORE UPDATE OR DELETE ON calibration_deletion_events
FOR EACH ROW EXECUTE FUNCTION pcs_reject_calibration_deletion_event_mutation();

CREATE OR REPLACE FUNCTION pcs_record_calibration_consent_withdrawal()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'granted' AND NEW.status = 'withdrawn' THEN
    INSERT INTO calibration_deletion_events (calibration_record_id, reason)
    SELECT calibration_record_id, 'consent-withdrawn'
    FROM calibration_record_links
    WHERE consent_receipt_id = NEW.consent_receipt_id
    ON CONFLICT (calibration_record_id, reason) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER calibration_consent_withdrawal_deletion_event
AFTER UPDATE OF status ON calibration_consent_receipts
FOR EACH ROW EXECUTE FUNCTION pcs_record_calibration_consent_withdrawal();

CREATE OR REPLACE FUNCTION pcs_record_calibration_consent_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  owner_session_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM anonymous_sessions
    WHERE session_id = OLD.session_id
  )
  INTO owner_session_exists;

  IF owner_session_exists THEN
    RAISE EXCEPTION 'calibration consent receipt may only delete with owner session';
  END IF;

  INSERT INTO calibration_deletion_events (calibration_record_id, reason)
  SELECT calibration_record_id, 'owner-session-deleted'
  FROM calibration_record_links
  WHERE consent_receipt_id = OLD.consent_receipt_id
  ON CONFLICT (calibration_record_id, reason) DO NOTHING;

  RETURN OLD;
END;
$$;

CREATE TRIGGER calibration_consent_delete_deletion_event
BEFORE DELETE ON calibration_consent_receipts
FOR EACH ROW EXECUTE FUNCTION pcs_record_calibration_consent_delete();

COMMIT;
