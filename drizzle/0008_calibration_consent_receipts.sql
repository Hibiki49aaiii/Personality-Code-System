BEGIN;

CREATE TABLE calibration_consent_receipts (
  consent_receipt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES anonymous_sessions(session_id) ON DELETE CASCADE,
  assessment_model_version text NOT NULL REFERENCES assessment_model_releases(model_version) ON DELETE RESTRICT,
  consent_version text NOT NULL,
  purpose_id text NOT NULL,
  locale text NOT NULL,
  status text NOT NULL DEFAULT 'granted',
  granted_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calibration_consent_receipt_status_chk
    CHECK (status IN ('granted','withdrawn')),
  CONSTRAINT calibration_consent_receipt_consent_version_chk
    CHECK (consent_version ~ '^[a-z0-9][a-z0-9._-]{2,119}$'),
  CONSTRAINT calibration_consent_receipt_purpose_id_chk
    CHECK (purpose_id ~ '^[a-z0-9][a-z0-9._-]{2,119}$'),
  CONSTRAINT calibration_consent_receipt_withdrawal_chk
    CHECK (
      (status = 'granted' AND withdrawn_at IS NULL)
      OR
      (status = 'withdrawn' AND withdrawn_at IS NOT NULL AND withdrawn_at >= granted_at)
    )
);

CREATE UNIQUE INDEX calibration_consent_receipts_session_purpose_uq
  ON calibration_consent_receipts(session_id, purpose_id);

CREATE INDEX calibration_consent_receipts_model_created_idx
  ON calibration_consent_receipts(assessment_model_version, created_at);

CREATE OR REPLACE FUNCTION pcs_validate_calibration_consent_receipt()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  owning_model text;
  owning_locale text;
BEGIN
  SELECT model_version, locale
    INTO owning_model, owning_locale
  FROM anonymous_sessions
  WHERE session_id = NEW.session_id;

  IF owning_model IS NULL THEN
    RAISE EXCEPTION 'calibration consent receipt requires an existing anonymous session';
  END IF;

  IF NEW.assessment_model_version <> owning_model OR NEW.locale <> owning_locale THEN
    RAISE EXCEPTION 'calibration consent receipt model/locale must match owning session';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'granted' OR NEW.withdrawn_at IS NOT NULL THEN
      RAISE EXCEPTION 'calibration consent receipt must begin in granted state';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.session_id <> OLD.session_id
     OR NEW.assessment_model_version <> OLD.assessment_model_version
     OR NEW.consent_version <> OLD.consent_version
     OR NEW.purpose_id <> OLD.purpose_id
     OR NEW.locale <> OLD.locale
     OR NEW.granted_at <> OLD.granted_at
     OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'calibration consent receipt identity is immutable';
  END IF;

  IF OLD.status = 'withdrawn' THEN
    RAISE EXCEPTION 'withdrawn calibration consent receipt is immutable';
  END IF;

  IF NEW.status <> 'withdrawn' OR NEW.withdrawn_at IS NULL THEN
    RAISE EXCEPTION 'calibration consent receipt update may only withdraw consent';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER calibration_consent_receipts_guard
BEFORE INSERT OR UPDATE ON calibration_consent_receipts
FOR EACH ROW EXECUTE FUNCTION pcs_validate_calibration_consent_receipt();

COMMIT;
