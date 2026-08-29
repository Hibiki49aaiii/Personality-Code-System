BEGIN;

-- Harden the 0009 trigger/helper chain so it remains safe when invoked
-- from SECURITY DEFINER functions whose search_path is pg_catalog only.
CREATE OR REPLACE FUNCTION public.pcs_require_active_calibration_operator_role(
  target_operator_id uuid,
  required_role text
)
RETURNS void
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  operator_status text;
  role_exists boolean;
BEGIN
  SELECT o.status
    INTO operator_status
  FROM public.calibration_operators o
  WHERE o.operator_id = target_operator_id;

  IF operator_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'calibration operator must be active';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.calibration_operator_roles r
    WHERE r.operator_id = target_operator_id
      AND r.role = required_role
  )
  INTO role_exists;

  IF role_exists IS NOT TRUE THEN
    RAISE EXCEPTION 'calibration operator lacks required role %', required_role;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_require_active_calibration_operator_role(uuid,text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_export_request_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM public.pcs_require_active_calibration_operator_role(
    NEW.requester_operator_id,
    'calibration-export-requester'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_export_request_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
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

  PERFORM public.pcs_require_active_calibration_operator_role(
    OLD.requester_operator_id,
    'calibration-export-requester'
  );
  PERFORM public.pcs_require_active_calibration_operator_role(
    NEW.approver_operator_id,
    'calibration-export-approver'
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_audit_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF NEW.action IN ('export-approved','export-rejected') THEN
    PERFORM public.pcs_require_active_calibration_operator_role(
      NEW.requester_operator_id,
      'calibration-export-requester'
    );
    PERFORM public.pcs_require_active_calibration_operator_role(
      NEW.approver_operator_id,
      'calibration-export-approver'
    );
  ELSE
    PERFORM public.pcs_require_active_calibration_operator_role(
      NEW.requester_operator_id,
      'calibration-privacy-operator'
    );
    PERFORM public.pcs_require_active_calibration_operator_role(
      NEW.approver_operator_id,
      'calibration-reviewer'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.pcs_authenticate_calibration_operator(
  p_credential_hash text
)
RETURNS TABLE (
  operator_id uuid,
  status text,
  role text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT
    o.operator_id,
    o.status,
    r.role
  FROM public.calibration_operators o
  LEFT JOIN public.calibration_operator_roles r
    ON r.operator_id = o.operator_id
  WHERE p_credential_hash ~ '^[a-f0-9]{64}$'
    AND o.credential_hash = p_credential_hash
    AND o.status = 'active'
  ORDER BY r.role ASC NULLS LAST
$$;

REVOKE ALL ON FUNCTION public.pcs_authenticate_calibration_operator(text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.pcs_request_calibration_export(
  p_credential_hash text,
  p_purpose_code text,
  p_wave_id text,
  p_export_schema_version text,
  p_consent_version text,
  p_assessment_model_version text,
  p_item_bank_version text,
  p_scoring_version text,
  p_trait_dictionary_version text,
  p_locale text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_requester_operator_id uuid;
  v_request_id uuid;
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
    AND r.role = 'calibration-export-requester';

  IF v_requester_operator_id IS NULL THEN
    RAISE EXCEPTION 'calibration authorization failed';
  END IF;

  IF p_wave_id <> 'beta-ja-wave-01-draft'
     OR p_export_schema_version <> 'calibration-export-record-v0.1-dev'
     OR p_consent_version <> 'calibration-consent-ja-v0.1-dev'
     OR p_assessment_model_version <> 'assessment-dev-v0.3'
     OR p_item_bank_version <> 'item-bank-v0.2'
     OR p_scoring_version <> 'scoring-v0.1-dev'
     OR p_trait_dictionary_version <> 'trait-dictionary-v0.2'
     OR p_locale <> 'ja-JP' THEN
    RAISE EXCEPTION 'calibration scope mismatch';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.assessment_model_releases m
    WHERE m.model_version = p_assessment_model_version
      AND m.locale = p_locale
      AND m.item_bank_version = p_item_bank_version
      AND m.scoring_version = p_scoring_version
      AND m.trait_dictionary_version = p_trait_dictionary_version
      AND m.status IN ('beta','published')
  ) THEN
    RAISE EXCEPTION 'calibration scope mismatch';
  END IF;

  INSERT INTO public.calibration_export_requests (
    requester_operator_id,
    purpose_code,
    wave_id,
    export_schema_version,
    consent_version,
    assessment_model_version,
    item_bank_version,
    scoring_version,
    trait_dictionary_version,
    locale
  )
  VALUES (
    v_requester_operator_id,
    p_purpose_code,
    p_wave_id,
    p_export_schema_version,
    p_consent_version,
    p_assessment_model_version,
    p_item_bank_version,
    p_scoring_version,
    p_trait_dictionary_version,
    p_locale
  )
  RETURNING request_id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_request_calibration_export(
  text,text,text,text,text,text,text,text,text,text
) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.pcs_review_calibration_export_request(
  p_credential_hash text,
  p_request_id uuid
)
RETURNS TABLE (
  request_id uuid,
  status text,
  requester_operator_id uuid,
  approver_operator_id uuid,
  purpose_code text,
  wave_id text,
  export_schema_version text,
  consent_version text,
  assessment_model_version text,
  item_bank_version text,
  scoring_version text,
  trait_dictionary_version text,
  locale text,
  requested_at timestamptz,
  decided_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_operator_id uuid;
BEGIN
  IF p_credential_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'calibration authorization failed';
  END IF;

  SELECT o.operator_id
  INTO v_operator_id
  FROM public.calibration_operators o
  WHERE o.credential_hash = p_credential_hash
    AND o.status = 'active'
    AND EXISTS (
      SELECT 1
      FROM public.calibration_operator_roles r
      WHERE r.operator_id = o.operator_id
        AND r.role IN ('calibration-export-approver','calibration-reviewer')
    );

  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'calibration authorization failed';
  END IF;

  RETURN QUERY
  SELECT
    q.request_id,
    q.status,
    q.requester_operator_id,
    q.approver_operator_id,
    q.purpose_code,
    q.wave_id,
    q.export_schema_version,
    q.consent_version,
    q.assessment_model_version,
    q.item_bank_version,
    q.scoring_version,
    q.trait_dictionary_version,
    q.locale,
    q.requested_at,
    q.decided_at
  FROM public.calibration_export_requests q
  WHERE q.request_id = p_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_review_calibration_export_request(text,uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.pcs_decide_calibration_export_request(
  p_credential_hash text,
  p_request_id uuid,
  p_decision text
)
RETURNS TABLE (
  request_id uuid,
  status text,
  requester_operator_id uuid,
  approver_operator_id uuid,
  decided_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_approver_operator_id uuid;
  v_request public.calibration_export_requests%ROWTYPE;
  v_status text;
BEGIN
  IF p_credential_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'calibration authorization failed';
  END IF;

  IF p_decision NOT IN ('approved','rejected') THEN
    RAISE EXCEPTION 'invalid calibration export decision';
  END IF;

  SELECT o.operator_id
  INTO v_approver_operator_id
  FROM public.calibration_operators o
  JOIN public.calibration_operator_roles r
    ON r.operator_id = o.operator_id
  WHERE o.credential_hash = p_credential_hash
    AND o.status = 'active'
    AND r.role = 'calibration-export-approver';

  IF v_approver_operator_id IS NULL THEN
    RAISE EXCEPTION 'calibration authorization failed';
  END IF;

  SELECT *
  INTO v_request
  FROM public.calibration_export_requests q
  WHERE q.request_id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'calibration export request not found';
  END IF;

  IF v_request.status <> 'requested' THEN
    RAISE EXCEPTION 'calibration export request already decided';
  END IF;

  IF v_request.requester_operator_id = v_approver_operator_id THEN
    RAISE EXCEPTION 'calibration self approval forbidden';
  END IF;

  v_status := p_decision;

  UPDATE public.calibration_export_requests q
  SET
    status = v_status,
    approver_operator_id = v_approver_operator_id,
    decided_at = now()
  WHERE q.request_id = p_request_id;

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
    CASE WHEN v_status = 'approved' THEN 'export-approved' ELSE 'export-rejected' END,
    v_request.requester_operator_id,
    v_approver_operator_id,
    v_request.purpose_code,
    v_request.wave_id,
    v_request.export_schema_version,
    v_request.consent_version,
    v_request.assessment_model_version,
    v_request.item_bank_version,
    v_request.scoring_version,
    v_request.trait_dictionary_version,
    v_request.locale,
    NULL,
    NULL,
    v_status
  );

  RETURN QUERY
  SELECT
    q.request_id,
    q.status,
    q.requester_operator_id,
    q.approver_operator_id,
    q.decided_at
  FROM public.calibration_export_requests q
  WHERE q.request_id = p_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_decide_calibration_export_request(text,uuid,text) FROM PUBLIC;

COMMIT;
