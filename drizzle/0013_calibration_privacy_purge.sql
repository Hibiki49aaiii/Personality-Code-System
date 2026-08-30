BEGIN;

ALTER TABLE public.calibration_operator_audit_events
  DROP CONSTRAINT calibration_operator_audit_action_chk;

ALTER TABLE public.calibration_operator_audit_events
  ADD CONSTRAINT calibration_operator_audit_action_chk
  CHECK (
    action IN (
      'export-approved',
      'export-rejected',
      'privacy-purge-requested',
      'privacy-purge-confirmed',
      'privacy-purge-rejected'
    )
  );

CREATE TABLE public.calibration_privacy_purge_requests (
  purge_request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_operator_id uuid NOT NULL
    REFERENCES public.calibration_operators(operator_id) ON DELETE RESTRICT,
  reviewer_operator_id uuid
    REFERENCES public.calibration_operators(operator_id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'requested',
  target_count integer NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  CONSTRAINT calibration_privacy_purge_request_status_chk
    CHECK (status IN ('requested','confirmed','rejected')),
  CONSTRAINT calibration_privacy_purge_request_target_count_chk
    CHECK (target_count >= 1),
  CONSTRAINT calibration_privacy_purge_request_distinct_operators_chk
    CHECK (reviewer_operator_id IS NULL OR reviewer_operator_id <> requester_operator_id),
  CONSTRAINT calibration_privacy_purge_request_decision_chk
    CHECK (
      (
        status = 'requested'
        AND reviewer_operator_id IS NULL
        AND decided_at IS NULL
      )
      OR
      (
        status IN ('confirmed','rejected')
        AND reviewer_operator_id IS NOT NULL
        AND decided_at IS NOT NULL
      )
    )
);

CREATE INDEX calibration_privacy_purge_requests_status_requested_idx
  ON public.calibration_privacy_purge_requests(status, requested_at);

CREATE TABLE public.calibration_privacy_purge_request_targets (
  purge_request_id uuid NOT NULL
    REFERENCES public.calibration_privacy_purge_requests(purge_request_id) ON DELETE RESTRICT,
  calibration_record_id uuid NOT NULL,
  qualifying_deletion_event_id uuid NOT NULL
    REFERENCES public.calibration_deletion_events(deletion_event_id) ON DELETE RESTRICT,
  qualifying_reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (purge_request_id, calibration_record_id),
  CONSTRAINT calibration_privacy_purge_target_reason_chk
    CHECK (
      qualifying_reason IN (
        'consent-withdrawn',
        'owner-session-deleted',
        'retest-pair-invalidated'
      )
    )
);

CREATE INDEX calibration_privacy_purge_targets_record_idx
  ON public.calibration_privacy_purge_request_targets(calibration_record_id);

CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_privacy_purge_request_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM public.pcs_require_active_calibration_operator_role(
    NEW.requester_operator_id,
    'calibration-privacy-operator'
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_validate_calibration_privacy_purge_request_insert() FROM PUBLIC;

CREATE TRIGGER calibration_privacy_purge_requests_insert_guard
BEFORE INSERT ON public.calibration_privacy_purge_requests
FOR EACH ROW EXECUTE FUNCTION public.pcs_validate_calibration_privacy_purge_request_insert();

CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_privacy_purge_request_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF NEW.purge_request_id <> OLD.purge_request_id
     OR NEW.requester_operator_id <> OLD.requester_operator_id
     OR NEW.target_count <> OLD.target_count
     OR NEW.requested_at <> OLD.requested_at THEN
    RAISE EXCEPTION 'calibration privacy purge request identity is immutable';
  END IF;

  IF OLD.status <> 'requested' THEN
    RAISE EXCEPTION 'decided calibration privacy purge request is immutable';
  END IF;

  IF NEW.status NOT IN ('confirmed','rejected')
     OR NEW.reviewer_operator_id IS NULL
     OR NEW.reviewer_operator_id = NEW.requester_operator_id
     OR NEW.decided_at IS NULL THEN
    RAISE EXCEPTION 'calibration privacy purge decision requires a distinct reviewer';
  END IF;

  PERFORM public.pcs_require_active_calibration_operator_role(
    OLD.requester_operator_id,
    'calibration-privacy-operator'
  );
  PERFORM public.pcs_require_active_calibration_operator_role(
    NEW.reviewer_operator_id,
    'calibration-reviewer'
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_validate_calibration_privacy_purge_request_update() FROM PUBLIC;

CREATE TRIGGER calibration_privacy_purge_requests_update_guard
BEFORE UPDATE ON public.calibration_privacy_purge_requests
FOR EACH ROW EXECUTE FUNCTION public.pcs_validate_calibration_privacy_purge_request_update();

CREATE OR REPLACE FUNCTION public.pcs_reject_calibration_privacy_purge_request_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION 'calibration privacy purge requests are retained governance records';
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_reject_calibration_privacy_purge_request_delete() FROM PUBLIC;

CREATE TRIGGER calibration_privacy_purge_requests_delete_guard
BEFORE DELETE ON public.calibration_privacy_purge_requests
FOR EACH ROW EXECUTE FUNCTION public.pcs_reject_calibration_privacy_purge_request_delete();

CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_privacy_purge_target_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  request_status text;
  event_record_id uuid;
  event_reason text;
BEGIN
  SELECT q.status
    INTO request_status
  FROM public.calibration_privacy_purge_requests q
  WHERE q.purge_request_id = NEW.purge_request_id;

  IF request_status IS DISTINCT FROM 'requested' THEN
    RAISE EXCEPTION 'calibration privacy purge target requires a requested purge';
  END IF;

  SELECT e.calibration_record_id, e.reason
    INTO event_record_id, event_reason
  FROM public.calibration_deletion_events e
  WHERE e.deletion_event_id = NEW.qualifying_deletion_event_id;

  IF event_record_id IS DISTINCT FROM NEW.calibration_record_id
     OR event_reason IS DISTINCT FROM NEW.qualifying_reason
     OR event_reason NOT IN (
       'consent-withdrawn',
       'owner-session-deleted',
       'retest-pair-invalidated'
     ) THEN
    RAISE EXCEPTION 'calibration privacy purge target requires a matching qualifying deletion event';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.calibration_records r
    WHERE r.calibration_record_id = NEW.calibration_record_id
  ) THEN
    RAISE EXCEPTION 'calibration privacy purge target must still exist';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_validate_calibration_privacy_purge_target_insert() FROM PUBLIC;

CREATE TRIGGER calibration_privacy_purge_targets_insert_guard
BEFORE INSERT ON public.calibration_privacy_purge_request_targets
FOR EACH ROW EXECUTE FUNCTION public.pcs_validate_calibration_privacy_purge_target_insert();

CREATE OR REPLACE FUNCTION public.pcs_reject_calibration_privacy_purge_target_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION 'calibration privacy purge targets are immutable';
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_reject_calibration_privacy_purge_target_mutation() FROM PUBLIC;

CREATE TRIGGER calibration_privacy_purge_targets_immutable
BEFORE UPDATE OR DELETE ON public.calibration_privacy_purge_request_targets
FOR EACH ROW EXECUTE FUNCTION public.pcs_reject_calibration_privacy_purge_target_mutation();

CREATE OR REPLACE FUNCTION public.pcs_request_calibration_privacy_purge(
  p_credential_hash text,
  p_calibration_record_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_requester_operator_id uuid;
  v_request_id uuid;
  v_target_ids uuid[];
  v_target_count integer;
  v_inserted_target_count integer;
BEGIN
  IF p_credential_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'calibration authorization failed';
  END IF;

  SELECT o.operator_id
    INTO v_requester_operator_id
  FROM public.calibration_operators o
  JOIN public.calibration_operator_roles r
    ON r.operator_id = o.operator_id
  WHERE o.credential_hash = p_credential_hash
    AND o.status = 'active'
    AND r.role = 'calibration-privacy-operator';

  IF v_requester_operator_id IS NULL THEN
    RAISE EXCEPTION 'calibration authorization failed';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.calibration_records r
    WHERE r.calibration_record_id = p_calibration_record_id
  ) THEN
    RAISE EXCEPTION 'calibration purge target is not present';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.calibration_deletion_events e
    WHERE e.calibration_record_id = p_calibration_record_id
      AND e.reason IN (
        'consent-withdrawn',
        'owner-session-deleted',
        'retest-pair-invalidated'
      )
  ) THEN
    RAISE EXCEPTION 'calibration purge target is not privacy-authorized';
  END IF;

  SELECT array_agg(candidate.record_id ORDER BY candidate.record_id)
    INTO v_target_ids
  FROM (
    SELECT p_calibration_record_id AS record_id
    UNION
    SELECT l.baseline_calibration_record_id
    FROM public.calibration_retest_linkages l
    WHERE l.baseline_calibration_record_id = p_calibration_record_id
       OR l.retest_calibration_record_id = p_calibration_record_id
    UNION
    SELECT l.retest_calibration_record_id
    FROM public.calibration_retest_linkages l
    WHERE l.retest_calibration_record_id IS NOT NULL
      AND (
        l.baseline_calibration_record_id = p_calibration_record_id
        OR l.retest_calibration_record_id = p_calibration_record_id
      )
  ) candidate
  WHERE candidate.record_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.calibration_records r
      WHERE r.calibration_record_id = candidate.record_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.calibration_deletion_events e
      WHERE e.calibration_record_id = candidate.record_id
        AND e.reason IN (
          'consent-withdrawn',
          'owner-session-deleted',
          'retest-pair-invalidated'
        )
    );

  v_target_count := COALESCE(cardinality(v_target_ids), 0);

  IF v_target_count < 1 THEN
    RAISE EXCEPTION 'calibration purge request has no current privacy-authorized targets';
  END IF;

  PERFORM r.calibration_record_id
  FROM public.calibration_records r
  WHERE r.calibration_record_id = ANY(v_target_ids)
  ORDER BY r.calibration_record_id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1
    FROM public.calibration_privacy_purge_request_targets t
    JOIN public.calibration_privacy_purge_requests q
      ON q.purge_request_id = t.purge_request_id
    WHERE t.calibration_record_id = ANY(v_target_ids)
      AND q.status = 'requested'
  ) THEN
    RAISE EXCEPTION 'calibration purge target already has a pending request';
  END IF;

  INSERT INTO public.calibration_privacy_purge_requests (
    requester_operator_id,
    target_count
  )
  VALUES (
    v_requester_operator_id,
    v_target_count
  )
  RETURNING purge_request_id INTO v_request_id;

  INSERT INTO public.calibration_privacy_purge_request_targets (
    purge_request_id,
    calibration_record_id,
    qualifying_deletion_event_id,
    qualifying_reason
  )
  SELECT
    v_request_id,
    target.record_id,
    event.deletion_event_id,
    event.reason
  FROM unnest(v_target_ids) AS target(record_id)
  CROSS JOIN LATERAL (
    SELECT e.deletion_event_id, e.reason
    FROM public.calibration_deletion_events e
    WHERE e.calibration_record_id = target.record_id
      AND e.reason IN (
        'consent-withdrawn',
        'owner-session-deleted',
        'retest-pair-invalidated'
      )
    ORDER BY
      CASE e.reason
        WHEN 'consent-withdrawn' THEN 1
        WHEN 'owner-session-deleted' THEN 2
        WHEN 'retest-pair-invalidated' THEN 3
        ELSE 99
      END,
      e.occurred_at,
      e.deletion_event_id
    LIMIT 1
  ) event;

  GET DIAGNOSTICS v_inserted_target_count = ROW_COUNT;

  IF v_inserted_target_count <> v_target_count THEN
    RAISE EXCEPTION 'calibration purge target set changed during request';
  END IF;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_request_calibration_privacy_purge(text,uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.pcs_review_calibration_privacy_purge(
  p_credential_hash text,
  p_purge_request_id uuid
)
RETURNS TABLE (
  purge_request_id uuid,
  status text,
  requester_operator_id uuid,
  reviewer_operator_id uuid,
  target_count integer,
  requested_at timestamptz,
  decided_at timestamptz,
  calibration_record_id uuid,
  qualifying_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_reviewer_operator_id uuid;
BEGIN
  IF p_credential_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'calibration authorization failed';
  END IF;

  SELECT o.operator_id
    INTO v_reviewer_operator_id
  FROM public.calibration_operators o
  JOIN public.calibration_operator_roles r
    ON r.operator_id = o.operator_id
  WHERE o.credential_hash = p_credential_hash
    AND o.status = 'active'
    AND r.role = 'calibration-reviewer';

  IF v_reviewer_operator_id IS NULL THEN
    RAISE EXCEPTION 'calibration authorization failed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.calibration_privacy_purge_requests q
    WHERE q.purge_request_id = p_purge_request_id
      AND q.requester_operator_id = v_reviewer_operator_id
  ) THEN
    RAISE EXCEPTION 'calibration privacy purge self review forbidden';
  END IF;

  RETURN QUERY
  SELECT
    q.purge_request_id,
    q.status,
    q.requester_operator_id,
    q.reviewer_operator_id,
    q.target_count,
    q.requested_at,
    q.decided_at,
    t.calibration_record_id,
    t.qualifying_reason
  FROM public.calibration_privacy_purge_requests q
  JOIN public.calibration_privacy_purge_request_targets t
    ON t.purge_request_id = q.purge_request_id
  WHERE q.purge_request_id = p_purge_request_id
  ORDER BY t.calibration_record_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_review_calibration_privacy_purge(text,uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.pcs_decide_calibration_privacy_purge(
  p_credential_hash text,
  p_purge_request_id uuid,
  p_decision text
)
RETURNS TABLE (
  purge_request_id uuid,
  status text,
  requester_operator_id uuid,
  reviewer_operator_id uuid,
  target_count integer,
  deleted_record_count integer,
  decided_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_reviewer_operator_id uuid;
  v_request public.calibration_privacy_purge_requests%ROWTYPE;
  v_actual_target_count integer;
  v_deleted_count integer := 0;
BEGIN
  IF p_credential_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'calibration authorization failed';
  END IF;

  IF p_decision NOT IN ('confirmed','rejected') THEN
    RAISE EXCEPTION 'invalid calibration privacy purge decision';
  END IF;

  SELECT o.operator_id
    INTO v_reviewer_operator_id
  FROM public.calibration_operators o
  JOIN public.calibration_operator_roles r
    ON r.operator_id = o.operator_id
  WHERE o.credential_hash = p_credential_hash
    AND o.status = 'active'
    AND r.role = 'calibration-reviewer';

  IF v_reviewer_operator_id IS NULL THEN
    RAISE EXCEPTION 'calibration authorization failed';
  END IF;

  SELECT *
    INTO v_request
  FROM public.calibration_privacy_purge_requests q
  WHERE q.purge_request_id = p_purge_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'calibration privacy purge request not found';
  END IF;

  IF v_request.status <> 'requested' THEN
    RAISE EXCEPTION 'calibration privacy purge request already decided';
  END IF;

  IF v_request.requester_operator_id = v_reviewer_operator_id THEN
    RAISE EXCEPTION 'calibration privacy purge self review forbidden';
  END IF;

  PERFORM public.pcs_require_active_calibration_operator_role(
    v_request.requester_operator_id,
    'calibration-privacy-operator'
  );

  SELECT count(*)
    INTO v_actual_target_count
  FROM public.calibration_privacy_purge_request_targets t
  WHERE t.purge_request_id = p_purge_request_id;

  IF v_actual_target_count <> v_request.target_count THEN
    RAISE EXCEPTION 'calibration privacy purge target count drift';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.calibration_privacy_purge_request_targets t
    LEFT JOIN public.calibration_deletion_events e
      ON e.deletion_event_id = t.qualifying_deletion_event_id
    WHERE t.purge_request_id = p_purge_request_id
      AND (
        e.deletion_event_id IS NULL
        OR e.calibration_record_id <> t.calibration_record_id
        OR e.reason <> t.qualifying_reason
        OR e.reason NOT IN (
          'consent-withdrawn',
          'owner-session-deleted',
          'retest-pair-invalidated'
        )
      )
  ) THEN
    RAISE EXCEPTION 'calibration privacy purge target lost qualifying evidence';
  END IF;

  IF p_decision = 'confirmed' THEN
    PERFORM r.calibration_record_id
    FROM public.calibration_records r
    JOIN public.calibration_privacy_purge_request_targets t
      ON t.calibration_record_id = r.calibration_record_id
    WHERE t.purge_request_id = p_purge_request_id
    ORDER BY r.calibration_record_id
    FOR UPDATE OF r;

    INSERT INTO public.calibration_deletion_events (
      calibration_record_id,
      reason
    )
    SELECT
      t.calibration_record_id,
      'privacy-operator-purge'
    FROM public.calibration_privacy_purge_request_targets t
    JOIN public.calibration_records r
      ON r.calibration_record_id = t.calibration_record_id
    WHERE t.purge_request_id = p_purge_request_id
    ON CONFLICT (calibration_record_id, reason) DO NOTHING;

    WITH deleted AS (
      DELETE FROM public.calibration_records r
      USING public.calibration_privacy_purge_request_targets t
      WHERE t.purge_request_id = p_purge_request_id
        AND r.calibration_record_id = t.calibration_record_id
      RETURNING r.calibration_record_id
    )
    SELECT count(*) INTO v_deleted_count FROM deleted;

    UPDATE public.calibration_privacy_purge_requests q
    SET
      status = 'confirmed',
      reviewer_operator_id = v_reviewer_operator_id,
      decided_at = now()
    WHERE q.purge_request_id = p_purge_request_id;

    INSERT INTO public.calibration_operator_audit_events (
      action,
      requester_operator_id,
      approver_operator_id,
      purpose_code,
      wave_id,
      export_schema_version,
      consent_version,
      assessment_model_version,
      item_bank_version,
      scoring_version,
      trait_dictionary_version,
      locale,
      row_count,
      artifact_sha256,
      disposition
    )
    VALUES (
      'privacy-purge-confirmed',
      v_request.requester_operator_id,
      v_reviewer_operator_id,
      'privacy-record-purge',
      'beta-ja-wave-01-draft',
      'not-applicable-privacy-purge',
      'privacy-purge-policy-v0.1-dev',
      'assessment-dev-v0.3',
      'item-bank-v0.2',
      'scoring-v0.1-dev',
      'trait-dictionary-v0.2',
      'ja-JP',
      v_deleted_count,
      NULL,
      'purged'
    );
  ELSE
    UPDATE public.calibration_privacy_purge_requests q
    SET
      status = 'rejected',
      reviewer_operator_id = v_reviewer_operator_id,
      decided_at = now()
    WHERE q.purge_request_id = p_purge_request_id;

    INSERT INTO public.calibration_operator_audit_events (
      action,
      requester_operator_id,
      approver_operator_id,
      purpose_code,
      wave_id,
      export_schema_version,
      consent_version,
      assessment_model_version,
      item_bank_version,
      scoring_version,
      trait_dictionary_version,
      locale,
      row_count,
      artifact_sha256,
      disposition
    )
    VALUES (
      'privacy-purge-rejected',
      v_request.requester_operator_id,
      v_reviewer_operator_id,
      'privacy-record-purge',
      'beta-ja-wave-01-draft',
      'not-applicable-privacy-purge',
      'privacy-purge-policy-v0.1-dev',
      'assessment-dev-v0.3',
      'item-bank-v0.2',
      'scoring-v0.1-dev',
      'trait-dictionary-v0.2',
      'ja-JP',
      0,
      NULL,
      'rejected'
    );
  END IF;

  RETURN QUERY
  SELECT
    q.purge_request_id,
    q.status,
    q.requester_operator_id,
    q.reviewer_operator_id,
    q.target_count,
    v_deleted_count,
    q.decided_at
  FROM public.calibration_privacy_purge_requests q
  WHERE q.purge_request_id = p_purge_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_decide_calibration_privacy_purge(text,uuid,text) FROM PUBLIC;

COMMIT;
