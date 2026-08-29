BEGIN;

CREATE TABLE public.calibration_records (
  calibration_record_id uuid PRIMARY KEY
    REFERENCES public.calibration_record_links(calibration_record_id) ON DELETE CASCADE,
  wave_id text NOT NULL,
  assessment_model_version text NOT NULL
    REFERENCES public.assessment_model_releases(model_version) ON DELETE RESTRICT,
  item_bank_version text NOT NULL,
  scoring_version text NOT NULL,
  trait_dictionary_version text NOT NULL,
  locale text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calibration_record_status_chk
    CHECK (status IN ('draft','complete')),
  CONSTRAINT calibration_record_completion_chk
    CHECK (
      (status = 'draft' AND completed_at IS NULL)
      OR
      (status = 'complete' AND completed_at IS NOT NULL)
    )
);

CREATE INDEX calibration_records_model_status_idx
  ON public.calibration_records(assessment_model_version, status);

CREATE TABLE public.calibration_item_responses (
  calibration_record_id uuid NOT NULL
    REFERENCES public.calibration_records(calibration_record_id) ON DELETE CASCADE,
  item_id text NOT NULL,
  item_revision text NOT NULL,
  locale text NOT NULL,
  value integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (calibration_record_id, item_id),
  CONSTRAINT calibration_item_response_revision_fk
    FOREIGN KEY (item_id, item_revision, locale)
    REFERENCES public.assessment_item_revisions(item_id, revision, locale)
    ON DELETE RESTRICT,
  CONSTRAINT calibration_item_response_value_chk
    CHECK (value BETWEEN 1 AND 5)
);

CREATE INDEX calibration_item_responses_item_idx
  ON public.calibration_item_responses(item_id, item_revision);

-- A model's item mapping is editable only while the release is draft.
-- Once the release enters beta, the repository-frozen mapping must not drift;
-- later revisions require a new assessment model version.
CREATE OR REPLACE FUNCTION public.pcs_protect_published_model_items()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  old_model_status text;
  new_model_status text;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    SELECT m.status
      INTO old_model_status
    FROM public.assessment_model_releases m
    WHERE m.model_version = OLD.model_version
    FOR SHARE OF m;

    IF old_model_status = 'published' THEN
      RAISE EXCEPTION 'items belonging to a published assessment model are immutable';
    END IF;
    IF old_model_status = 'beta' THEN
      RAISE EXCEPTION 'items belonging to a beta assessment model are immutable';
    END IF;
  END IF;

  IF TG_OP <> 'DELETE' THEN
    SELECT m.status
      INTO new_model_status
    FROM public.assessment_model_releases m
    WHERE m.model_version = NEW.model_version
    FOR SHARE OF m;

    IF new_model_status = 'published' THEN
      RAISE EXCEPTION 'items belonging to a published assessment model are immutable';
    END IF;
    IF new_model_status = 'beta' THEN
      RAISE EXCEPTION 'items belonging to a beta assessment model are immutable';
    END IF;
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_record_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  consent_status text;
  consent_model text;
  consent_version text;
  consent_purpose text;
  consent_locale text;
  release_item_bank text;
  release_scoring text;
  release_trait_dictionary text;
  release_locale text;
BEGIN
  IF NEW.status <> 'draft' OR NEW.completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'calibration record must begin in draft state';
  END IF;

  IF NEW.wave_id <> 'beta-ja-wave-01-draft'
     OR NEW.assessment_model_version <> 'assessment-dev-v0.3'
     OR NEW.item_bank_version <> 'item-bank-v0.2'
     OR NEW.scoring_version <> 'scoring-v0.1-dev'
     OR NEW.trait_dictionary_version <> 'trait-dictionary-v0.2'
     OR NEW.locale <> 'ja-JP' THEN
    RAISE EXCEPTION 'calibration record scope mismatch';
  END IF;

  SELECT
    c.status,
    c.assessment_model_version,
    c.consent_version,
    c.purpose_id,
    c.locale
  INTO
    consent_status,
    consent_model,
    consent_version,
    consent_purpose,
    consent_locale
  FROM public.calibration_record_links l
  JOIN public.calibration_consent_receipts c
    ON c.consent_receipt_id = l.consent_receipt_id
  WHERE l.calibration_record_id = NEW.calibration_record_id
  FOR UPDATE OF c;

  IF consent_status IS DISTINCT FROM 'granted'
     OR consent_model IS DISTINCT FROM NEW.assessment_model_version
     OR consent_version IS DISTINCT FROM 'calibration-consent-ja-v0.1-dev'
     OR consent_purpose IS DISTINCT FROM 'psychometric-calibration-v0.1'
     OR consent_locale IS DISTINCT FROM NEW.locale THEN
    RAISE EXCEPTION 'calibration record requires matching granted consent';
  END IF;

  SELECT
    m.item_bank_version,
    m.scoring_version,
    m.trait_dictionary_version,
    m.locale
  INTO
    release_item_bank,
    release_scoring,
    release_trait_dictionary,
    release_locale
  FROM public.assessment_model_releases m
  WHERE m.model_version = NEW.assessment_model_version
    AND m.status IN ('beta','published')
  FOR SHARE OF m;

  IF release_item_bank IS DISTINCT FROM NEW.item_bank_version
     OR release_scoring IS DISTINCT FROM NEW.scoring_version
     OR release_trait_dictionary IS DISTINCT FROM NEW.trait_dictionary_version
     OR release_locale IS DISTINCT FROM NEW.locale THEN
    RAISE EXCEPTION 'calibration record release tuple mismatch';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_validate_calibration_record_insert() FROM PUBLIC;

CREATE TRIGGER calibration_records_insert_guard
BEFORE INSERT ON public.calibration_records
FOR EACH ROW EXECUTE FUNCTION public.pcs_validate_calibration_record_insert();

CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_item_response_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  record_status text;
  record_model text;
  record_item_bank text;
  record_scoring text;
  record_trait_dictionary text;
  record_locale text;
  consent_status text;
  release_status text;
  release_item_bank text;
  release_scoring text;
  release_trait_dictionary text;
  release_locale text;
  model_revision text;
  model_locale text;
BEGIN
  SELECT
    r.status,
    r.assessment_model_version,
    r.item_bank_version,
    r.scoring_version,
    r.trait_dictionary_version,
    r.locale,
    c.status
    INTO
      record_status,
      record_model,
      record_item_bank,
      record_scoring,
      record_trait_dictionary,
      record_locale,
      consent_status
  FROM public.calibration_records r
  JOIN public.calibration_record_links l
    ON l.calibration_record_id = r.calibration_record_id
  JOIN public.calibration_consent_receipts c
    ON c.consent_receipt_id = l.consent_receipt_id
  WHERE r.calibration_record_id = NEW.calibration_record_id
  FOR UPDATE OF c;

  IF record_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'calibration responses require a draft record';
  END IF;

  IF consent_status IS DISTINCT FROM 'granted' THEN
    RAISE EXCEPTION 'calibration responses require granted consent';
  END IF;

  SELECT
    m.status,
    m.item_bank_version,
    m.scoring_version,
    m.trait_dictionary_version,
    m.locale
    INTO
      release_status,
      release_item_bank,
      release_scoring,
      release_trait_dictionary,
      release_locale
  FROM public.assessment_model_releases m
  WHERE m.model_version = record_model
  FOR SHARE OF m;

  IF release_status NOT IN ('beta','published')
     OR release_item_bank IS DISTINCT FROM record_item_bank
     OR release_scoring IS DISTINCT FROM record_scoring
     OR release_trait_dictionary IS DISTINCT FROM record_trait_dictionary
     OR release_locale IS DISTINCT FROM record_locale THEN
    RAISE EXCEPTION 'calibration response release tuple mismatch';
  END IF;

  SELECT m.item_revision, m.locale
    INTO model_revision, model_locale
  FROM public.assessment_model_items m
  WHERE m.model_version = record_model
    AND m.item_id = NEW.item_id;

  IF model_revision IS NULL THEN
    RAISE EXCEPTION 'calibration response item is not part of the record assessment model';
  END IF;

  IF model_revision <> NEW.item_revision OR model_locale <> NEW.locale THEN
    RAISE EXCEPTION 'calibration response revision/locale mismatch';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_validate_calibration_item_response_insert() FROM PUBLIC;

CREATE TRIGGER calibration_item_responses_insert_guard
BEFORE INSERT ON public.calibration_item_responses
FOR EACH ROW EXECUTE FUNCTION public.pcs_validate_calibration_item_response_insert();

CREATE OR REPLACE FUNCTION public.pcs_assert_calibration_record_ready_to_complete(
  target_calibration_record_id uuid
)
RETURNS void
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  record_row public.calibration_records%ROWTYPE;
  consent_status text;
  consent_version text;
  consent_purpose text;
  consent_locale text;
  release_status text;
  release_item_bank text;
  release_scoring text;
  release_trait_dictionary text;
  release_locale text;
  expected_count integer;
  response_count integer;
BEGIN
  SELECT *
    INTO record_row
  FROM public.calibration_records r
  WHERE r.calibration_record_id = target_calibration_record_id;

  IF NOT FOUND OR record_row.status <> 'draft' THEN
    RAISE EXCEPTION 'calibration record is not draft';
  END IF;

  IF record_row.wave_id <> 'beta-ja-wave-01-draft'
     OR record_row.assessment_model_version <> 'assessment-dev-v0.3'
     OR record_row.item_bank_version <> 'item-bank-v0.2'
     OR record_row.scoring_version <> 'scoring-v0.1-dev'
     OR record_row.trait_dictionary_version <> 'trait-dictionary-v0.2'
     OR record_row.locale <> 'ja-JP' THEN
    RAISE EXCEPTION 'calibration record scope mismatch';
  END IF;

  SELECT c.status, c.consent_version, c.purpose_id, c.locale
    INTO consent_status, consent_version, consent_purpose, consent_locale
  FROM public.calibration_record_links l
  JOIN public.calibration_consent_receipts c
    ON c.consent_receipt_id = l.consent_receipt_id
  WHERE l.calibration_record_id = target_calibration_record_id
  FOR UPDATE OF c;

  IF consent_status IS DISTINCT FROM 'granted'
     OR consent_version IS DISTINCT FROM 'calibration-consent-ja-v0.1-dev'
     OR consent_purpose IS DISTINCT FROM 'psychometric-calibration-v0.1'
     OR consent_locale IS DISTINCT FROM record_row.locale THEN
    RAISE EXCEPTION 'calibration record completion requires matching granted consent';
  END IF;

  SELECT
    m.status,
    m.item_bank_version,
    m.scoring_version,
    m.trait_dictionary_version,
    m.locale
    INTO
      release_status,
      release_item_bank,
      release_scoring,
      release_trait_dictionary,
      release_locale
  FROM public.assessment_model_releases m
  WHERE m.model_version = record_row.assessment_model_version
  FOR SHARE OF m;

  IF release_status NOT IN ('beta','published')
     OR release_item_bank IS DISTINCT FROM record_row.item_bank_version
     OR release_scoring IS DISTINCT FROM record_row.scoring_version
     OR release_trait_dictionary IS DISTINCT FROM record_row.trait_dictionary_version
     OR release_locale IS DISTINCT FROM record_row.locale THEN
    RAISE EXCEPTION 'calibration record completion release tuple mismatch';
  END IF;

  SELECT COUNT(*)::integer
    INTO expected_count
  FROM public.assessment_model_items m
  WHERE m.model_version = record_row.assessment_model_version;

  SELECT COUNT(*)::integer
    INTO response_count
  FROM public.calibration_item_responses a
  WHERE a.calibration_record_id = target_calibration_record_id;

  IF expected_count <> 147 OR response_count <> expected_count THEN
    RAISE EXCEPTION 'calibration record is incomplete';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.assessment_model_items m
    LEFT JOIN public.calibration_item_responses a
      ON a.calibration_record_id = target_calibration_record_id
     AND a.item_id = m.item_id
     AND a.item_revision = m.item_revision
     AND a.locale = m.locale
    WHERE m.model_version = record_row.assessment_model_version
      AND a.item_id IS NULL
  ) THEN
    RAISE EXCEPTION 'calibration record is missing model responses';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_assert_calibration_record_ready_to_complete(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_record_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF OLD.status = 'complete' THEN
    RAISE EXCEPTION 'completed calibration record is immutable';
  END IF;

  IF NEW.calibration_record_id <> OLD.calibration_record_id
     OR NEW.wave_id <> OLD.wave_id
     OR NEW.assessment_model_version <> OLD.assessment_model_version
     OR NEW.item_bank_version <> OLD.item_bank_version
     OR NEW.scoring_version <> OLD.scoring_version
     OR NEW.trait_dictionary_version <> OLD.trait_dictionary_version
     OR NEW.locale <> OLD.locale
     OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'calibration record scope is immutable';
  END IF;

  IF NEW.status <> 'complete' OR NEW.completed_at IS NULL THEN
    RAISE EXCEPTION 'calibration record update may only finalize';
  END IF;

  PERFORM public.pcs_assert_calibration_record_ready_to_complete(OLD.calibration_record_id);

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_validate_calibration_record_update() FROM PUBLIC;

CREATE TRIGGER calibration_records_update_guard
BEFORE UPDATE ON public.calibration_records
FOR EACH ROW EXECUTE FUNCTION public.pcs_validate_calibration_record_update();

CREATE OR REPLACE FUNCTION public.pcs_finalize_calibration_record(
  target_calibration_record_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  UPDATE public.calibration_records
  SET status = 'complete',
      completed_at = now()
  WHERE calibration_record_id = target_calibration_record_id
    AND status = 'draft';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'calibration record is not draft';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_finalize_calibration_record(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.pcs_reject_calibration_item_response_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION 'calibration item responses are immutable';
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_reject_calibration_item_response_update() FROM PUBLIC;

CREATE TRIGGER calibration_item_responses_update_guard
BEFORE UPDATE ON public.calibration_item_responses
FOR EACH ROW EXECUTE FUNCTION public.pcs_reject_calibration_item_response_update();

CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_item_response_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  parent_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.calibration_records r
    WHERE r.calibration_record_id = OLD.calibration_record_id
  )
  INTO parent_exists;

  IF parent_exists THEN
    RAISE EXCEPTION 'calibration item responses may only delete with their parent record';
  END IF;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_validate_calibration_item_response_delete() FROM PUBLIC;

CREATE TRIGGER calibration_item_responses_delete_guard
BEFORE DELETE ON public.calibration_item_responses
FOR EACH ROW EXECUTE FUNCTION public.pcs_validate_calibration_item_response_delete();

CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_record_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  parent_link_exists boolean;
  privacy_deletion_authorized boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.calibration_record_links l
    WHERE l.calibration_record_id = OLD.calibration_record_id
  )
  INTO parent_link_exists;

  SELECT EXISTS (
    SELECT 1
    FROM public.calibration_deletion_events e
    WHERE e.calibration_record_id = OLD.calibration_record_id
      AND e.reason IN (
        'consent-withdrawn',
        'owner-session-deleted',
        'privacy-operator-purge'
      )
  )
  INTO privacy_deletion_authorized;

  IF parent_link_exists AND privacy_deletion_authorized IS NOT TRUE THEN
    RAISE EXCEPTION 'calibration record deletion requires a privacy deletion event or parent-link cascade';
  END IF;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_validate_calibration_record_delete() FROM PUBLIC;

CREATE TRIGGER calibration_records_delete_guard
BEFORE DELETE ON public.calibration_records
FOR EACH ROW EXECUTE FUNCTION public.pcs_validate_calibration_record_delete();

COMMIT;
