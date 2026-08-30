BEGIN;

ALTER TABLE public.calibration_deletion_events
  DROP CONSTRAINT calibration_deletion_event_reason_chk;

ALTER TABLE public.calibration_deletion_events
  ADD CONSTRAINT calibration_deletion_event_reason_chk
  CHECK (
    reason IN (
      'consent-withdrawn',
      'owner-session-deleted',
      'privacy-operator-purge',
      'retest-pair-invalidated'
    )
  );

-- Answer storage was introduced for the baseline consent identity in migration 0011.
-- Retest uses the same frozen measurement tuple but a distinct, purpose-specific
-- draft consent identity. No runtime role is granted access by this migration.
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
     OR consent_locale IS DISTINCT FROM NEW.locale
     OR NOT (
       (
         consent_version = 'calibration-consent-ja-v0.1-dev'
         AND consent_purpose = 'psychometric-calibration-v0.1'
       )
       OR
       (
         consent_version = 'calibration-retest-consent-ja-v0.1-dev'
         AND consent_purpose = 'psychometric-calibration-retest-v0.1'
       )
     ) THEN
    RAISE EXCEPTION 'calibration record requires matching granted consent for calibration/retest purpose';
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
     OR consent_locale IS DISTINCT FROM record_row.locale
     OR NOT (
       (
         consent_version = 'calibration-consent-ja-v0.1-dev'
         AND consent_purpose = 'psychometric-calibration-v0.1'
       )
       OR
       (
         consent_version = 'calibration-retest-consent-ja-v0.1-dev'
         AND consent_purpose = 'psychometric-calibration-retest-v0.1'
       )
     ) THEN
    RAISE EXCEPTION 'calibration record completion requires matching granted calibration/retest consent';
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

CREATE TABLE public.calibration_retest_linkages (
  retest_pair_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baseline_calibration_record_id uuid NOT NULL
    REFERENCES public.calibration_records(calibration_record_id) ON DELETE CASCADE,
  retest_calibration_record_id uuid
    REFERENCES public.calibration_records(calibration_record_id) ON DELETE CASCADE,
  claim_token_hash char(64) NOT NULL,
  wave_id text NOT NULL,
  assessment_model_version text NOT NULL
    REFERENCES public.assessment_model_releases(model_version) ON DELETE RESTRICT,
  item_bank_version text NOT NULL,
  scoring_version text NOT NULL,
  trait_dictionary_version text NOT NULL,
  locale text NOT NULL,
  eligible_from timestamptz NOT NULL,
  eligible_until timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'issued',
  issued_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  invalidated_at timestamptz,
  CONSTRAINT calibration_retest_claim_token_hash_chk
    CHECK (claim_token_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT calibration_retest_status_chk
    CHECK (status IN ('issued','claimed','invalidated')),
  CONSTRAINT calibration_retest_distinct_records_chk
    CHECK (
      retest_calibration_record_id IS NULL
      OR retest_calibration_record_id <> baseline_calibration_record_id
    ),
  CONSTRAINT calibration_retest_window_chk
    CHECK (
      eligible_until = eligible_from + interval '7 days'
      AND eligible_until > eligible_from
    ),
  CONSTRAINT calibration_retest_state_chk
    CHECK (
      (
        status = 'issued'
        AND retest_calibration_record_id IS NULL
        AND claimed_at IS NULL
        AND invalidated_at IS NULL
      )
      OR
      (
        status = 'claimed'
        AND retest_calibration_record_id IS NOT NULL
        AND claimed_at IS NOT NULL
        AND invalidated_at IS NULL
      )
      OR
      (
        status = 'invalidated'
        AND invalidated_at IS NOT NULL
      )
    )
);

CREATE UNIQUE INDEX calibration_retest_linkages_baseline_uq
  ON public.calibration_retest_linkages(baseline_calibration_record_id);

CREATE UNIQUE INDEX calibration_retest_linkages_retest_uq
  ON public.calibration_retest_linkages(retest_calibration_record_id)
  WHERE retest_calibration_record_id IS NOT NULL;

CREATE UNIQUE INDEX calibration_retest_linkages_claim_token_hash_uq
  ON public.calibration_retest_linkages(claim_token_hash);

CREATE INDEX calibration_retest_linkages_status_window_idx
  ON public.calibration_retest_linkages(status, eligible_from, eligible_until);

CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_retest_linkage_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  baseline_status text;
  baseline_completed_at timestamptz;
  baseline_wave text;
  baseline_model text;
  baseline_item_bank text;
  baseline_scoring text;
  baseline_trait_dictionary text;
  baseline_locale text;
  baseline_consent_status text;
  baseline_consent_version text;
  baseline_purpose_id text;
BEGIN
  IF NEW.status <> 'issued'
     OR NEW.retest_calibration_record_id IS NOT NULL
     OR NEW.claimed_at IS NOT NULL
     OR NEW.invalidated_at IS NOT NULL THEN
    RAISE EXCEPTION 'calibration retest linkage must begin in issued state';
  END IF;

  IF NEW.wave_id <> 'beta-ja-wave-01-draft'
     OR NEW.assessment_model_version <> 'assessment-dev-v0.3'
     OR NEW.item_bank_version <> 'item-bank-v0.2'
     OR NEW.scoring_version <> 'scoring-v0.1-dev'
     OR NEW.trait_dictionary_version <> 'trait-dictionary-v0.2'
     OR NEW.locale <> 'ja-JP' THEN
    RAISE EXCEPTION 'calibration retest scope mismatch';
  END IF;

  SELECT
    r.status,
    r.completed_at,
    r.wave_id,
    r.assessment_model_version,
    r.item_bank_version,
    r.scoring_version,
    r.trait_dictionary_version,
    r.locale,
    c.status,
    c.consent_version,
    c.purpose_id
  INTO
    baseline_status,
    baseline_completed_at,
    baseline_wave,
    baseline_model,
    baseline_item_bank,
    baseline_scoring,
    baseline_trait_dictionary,
    baseline_locale,
    baseline_consent_status,
    baseline_consent_version,
    baseline_purpose_id
  FROM public.calibration_records r
  JOIN public.calibration_record_links l
    ON l.calibration_record_id = r.calibration_record_id
  JOIN public.calibration_consent_receipts c
    ON c.consent_receipt_id = l.consent_receipt_id
  WHERE r.calibration_record_id = NEW.baseline_calibration_record_id
  FOR UPDATE OF c;

  IF baseline_status IS DISTINCT FROM 'complete'
     OR baseline_completed_at IS NULL
     OR baseline_consent_status IS DISTINCT FROM 'granted'
     OR baseline_consent_version IS DISTINCT FROM 'calibration-consent-ja-v0.1-dev'
     OR baseline_purpose_id IS DISTINCT FROM 'psychometric-calibration-v0.1'
     OR baseline_wave IS DISTINCT FROM NEW.wave_id
     OR baseline_model IS DISTINCT FROM NEW.assessment_model_version
     OR baseline_item_bank IS DISTINCT FROM NEW.item_bank_version
     OR baseline_scoring IS DISTINCT FROM NEW.scoring_version
     OR baseline_trait_dictionary IS DISTINCT FROM NEW.trait_dictionary_version
     OR baseline_locale IS DISTINCT FROM NEW.locale THEN
    RAISE EXCEPTION 'calibration retest baseline record/consent lineage invalid';
  END IF;

  IF NEW.eligible_from <> baseline_completed_at + interval '14 days'
     OR NEW.eligible_until <> baseline_completed_at + interval '21 days' THEN
    RAISE EXCEPTION 'calibration retest eligibility window mismatch';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_validate_calibration_retest_linkage_insert() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_retest_linkage_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  baseline_consent_status text;
  retest_status text;
  retest_completed_at timestamptz;
  retest_wave text;
  retest_model text;
  retest_item_bank text;
  retest_scoring text;
  retest_trait_dictionary text;
  retest_locale text;
  retest_consent_status text;
  retest_consent_version text;
  retest_purpose_id text;
  linked_withdrawn boolean;
BEGIN
  IF NEW.retest_pair_id <> OLD.retest_pair_id
     OR NEW.baseline_calibration_record_id <> OLD.baseline_calibration_record_id
     OR NEW.claim_token_hash <> OLD.claim_token_hash
     OR NEW.wave_id <> OLD.wave_id
     OR NEW.assessment_model_version <> OLD.assessment_model_version
     OR NEW.item_bank_version <> OLD.item_bank_version
     OR NEW.scoring_version <> OLD.scoring_version
     OR NEW.trait_dictionary_version <> OLD.trait_dictionary_version
     OR NEW.locale <> OLD.locale
     OR NEW.eligible_from <> OLD.eligible_from
     OR NEW.eligible_until <> OLD.eligible_until
     OR NEW.issued_at <> OLD.issued_at THEN
    RAISE EXCEPTION 'calibration retest linkage identity/scope is immutable';
  END IF;

  IF OLD.status = 'invalidated' THEN
    RAISE EXCEPTION 'invalidated calibration retest linkage is immutable';
  END IF;

  IF NEW.status = 'claimed' THEN
    IF OLD.status <> 'issued'
       OR OLD.retest_calibration_record_id IS NOT NULL
       OR NEW.retest_calibration_record_id IS NULL
       OR NEW.claimed_at IS NULL
       OR NEW.invalidated_at IS NOT NULL THEN
      RAISE EXCEPTION 'invalid calibration retest claim transition';
    END IF;

    SELECT c.status
      INTO baseline_consent_status
    FROM public.calibration_records r
    JOIN public.calibration_record_links l
      ON l.calibration_record_id = r.calibration_record_id
    JOIN public.calibration_consent_receipts c
      ON c.consent_receipt_id = l.consent_receipt_id
    WHERE r.calibration_record_id = OLD.baseline_calibration_record_id
    FOR UPDATE OF c;

    IF baseline_consent_status IS DISTINCT FROM 'granted' THEN
      RAISE EXCEPTION 'calibration retest baseline consent is not active';
    END IF;

    SELECT
      r.status,
      r.completed_at,
      r.wave_id,
      r.assessment_model_version,
      r.item_bank_version,
      r.scoring_version,
      r.trait_dictionary_version,
      r.locale,
      c.status,
      c.consent_version,
      c.purpose_id
    INTO
      retest_status,
      retest_completed_at,
      retest_wave,
      retest_model,
      retest_item_bank,
      retest_scoring,
      retest_trait_dictionary,
      retest_locale,
      retest_consent_status,
      retest_consent_version,
      retest_purpose_id
    FROM public.calibration_records r
    JOIN public.calibration_record_links l
      ON l.calibration_record_id = r.calibration_record_id
    JOIN public.calibration_consent_receipts c
      ON c.consent_receipt_id = l.consent_receipt_id
    WHERE r.calibration_record_id = NEW.retest_calibration_record_id
    FOR UPDATE OF c;

    IF retest_status IS DISTINCT FROM 'complete'
       OR retest_completed_at IS NULL
       OR retest_consent_status IS DISTINCT FROM 'granted'
       OR retest_consent_version IS DISTINCT FROM 'calibration-retest-consent-ja-v0.1-dev'
       OR retest_purpose_id IS DISTINCT FROM 'psychometric-calibration-retest-v0.1'
       OR retest_wave IS DISTINCT FROM NEW.wave_id
       OR retest_model IS DISTINCT FROM NEW.assessment_model_version
       OR retest_item_bank IS DISTINCT FROM NEW.item_bank_version
       OR retest_scoring IS DISTINCT FROM NEW.scoring_version
       OR retest_trait_dictionary IS DISTINCT FROM NEW.trait_dictionary_version
       OR retest_locale IS DISTINCT FROM NEW.locale THEN
      RAISE EXCEPTION 'calibration retest claim record/consent lineage invalid';
    END IF;

    IF retest_completed_at < NEW.eligible_from
       OR retest_completed_at > NEW.eligible_until THEN
      RAISE EXCEPTION 'calibration retest completion outside eligibility window';
    END IF;

    IF NEW.claimed_at < retest_completed_at THEN
      RAISE EXCEPTION 'calibration retest claim time precedes measurement completion';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.status = 'invalidated' THEN
    IF NEW.invalidated_at IS NULL
       OR NEW.retest_calibration_record_id IS DISTINCT FROM OLD.retest_calibration_record_id
       OR NEW.claimed_at IS DISTINCT FROM OLD.claimed_at THEN
      RAISE EXCEPTION 'invalid calibration retest invalidation transition';
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM public.calibration_record_links l
      JOIN public.calibration_consent_receipts c
        ON c.consent_receipt_id = l.consent_receipt_id
      WHERE l.calibration_record_id IN (
        OLD.baseline_calibration_record_id,
        OLD.retest_calibration_record_id
      )
        AND c.status = 'withdrawn'
    )
    INTO linked_withdrawn;

    IF linked_withdrawn IS NOT TRUE THEN
      RAISE EXCEPTION 'calibration retest invalidation requires linked consent withdrawal';
    END IF;

    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'calibration retest linkage update not allowed';
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_validate_calibration_retest_linkage_update() FROM PUBLIC;

CREATE TRIGGER calibration_retest_linkages_insert_guard
BEFORE INSERT ON public.calibration_retest_linkages
FOR EACH ROW EXECUTE FUNCTION public.pcs_validate_calibration_retest_linkage_insert();

CREATE TRIGGER calibration_retest_linkages_update_guard
BEFORE UPDATE ON public.calibration_retest_linkages
FOR EACH ROW EXECUTE FUNCTION public.pcs_validate_calibration_retest_linkage_update();

CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_retest_linkage_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  baseline_parent_exists boolean;
  retest_parent_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.calibration_records r
    WHERE r.calibration_record_id = OLD.baseline_calibration_record_id
  )
  INTO baseline_parent_exists;

  IF OLD.retest_calibration_record_id IS NULL THEN
    retest_parent_exists := true;
  ELSE
    SELECT EXISTS (
      SELECT 1
      FROM public.calibration_records r
      WHERE r.calibration_record_id = OLD.retest_calibration_record_id
    )
    INTO retest_parent_exists;
  END IF;

  -- ON DELETE CASCADE from a linked calibration record runs after that parent row
  -- is gone. Direct linkage deletion while all linked parent records still exist
  -- is forbidden so the pair cannot disappear outside the privacy lineage.
  IF baseline_parent_exists IS TRUE AND retest_parent_exists IS TRUE THEN
    RAISE EXCEPTION 'calibration retest linkage may only delete through calibration record cascade';
  END IF;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_validate_calibration_retest_linkage_delete() FROM PUBLIC;

CREATE TRIGGER calibration_retest_linkages_delete_guard
BEFORE DELETE ON public.calibration_retest_linkages
FOR EACH ROW EXECUTE FUNCTION public.pcs_validate_calibration_retest_linkage_delete();

CREATE OR REPLACE FUNCTION public.pcs_invalidate_calibration_retest_on_consent_withdrawal()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  affected_record_id uuid;
BEGIN
  IF OLD.status = 'granted' AND NEW.status = 'withdrawn' THEN
    SELECT l.calibration_record_id
      INTO affected_record_id
    FROM public.calibration_record_links l
    WHERE l.consent_receipt_id = NEW.consent_receipt_id;

    IF affected_record_id IS NOT NULL THEN
      INSERT INTO public.calibration_deletion_events (calibration_record_id, reason)
      SELECT x.record_id, 'retest-pair-invalidated'
      FROM (
        SELECT r.baseline_calibration_record_id AS record_id
        FROM public.calibration_retest_linkages r
        WHERE r.status <> 'invalidated'
          AND (
            r.baseline_calibration_record_id = affected_record_id
            OR r.retest_calibration_record_id = affected_record_id
          )
        UNION
        SELECT r.retest_calibration_record_id AS record_id
        FROM public.calibration_retest_linkages r
        WHERE r.status <> 'invalidated'
          AND r.retest_calibration_record_id IS NOT NULL
          AND (
            r.baseline_calibration_record_id = affected_record_id
            OR r.retest_calibration_record_id = affected_record_id
          )
      ) x
      WHERE x.record_id IS NOT NULL
      ON CONFLICT (calibration_record_id, reason) DO NOTHING;

      UPDATE public.calibration_retest_linkages r
      SET
        status = 'invalidated',
        invalidated_at = now()
      WHERE r.status <> 'invalidated'
        AND (
          r.baseline_calibration_record_id = affected_record_id
          OR r.retest_calibration_record_id = affected_record_id
        );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_invalidate_calibration_retest_on_consent_withdrawal() FROM PUBLIC;

CREATE TRIGGER calibration_retest_consent_withdrawal_invalidation
AFTER UPDATE OF status ON public.calibration_consent_receipts
FOR EACH ROW EXECUTE FUNCTION public.pcs_invalidate_calibration_retest_on_consent_withdrawal();

CREATE OR REPLACE FUNCTION public.pcs_journal_calibration_retest_on_record_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  INSERT INTO public.calibration_deletion_events (calibration_record_id, reason)
  SELECT x.record_id, 'retest-pair-invalidated'
  FROM (
    SELECT r.baseline_calibration_record_id AS record_id
    FROM public.calibration_retest_linkages r
    WHERE r.baseline_calibration_record_id = OLD.calibration_record_id
       OR r.retest_calibration_record_id = OLD.calibration_record_id
    UNION
    SELECT r.retest_calibration_record_id AS record_id
    FROM public.calibration_retest_linkages r
    WHERE r.retest_calibration_record_id IS NOT NULL
      AND (
        r.baseline_calibration_record_id = OLD.calibration_record_id
        OR r.retest_calibration_record_id = OLD.calibration_record_id
      )
  ) x
  WHERE x.record_id IS NOT NULL
  ON CONFLICT (calibration_record_id, reason) DO NOTHING;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.pcs_journal_calibration_retest_on_record_delete() FROM PUBLIC;

CREATE TRIGGER calibration_retest_record_delete_journal
BEFORE DELETE ON public.calibration_records
FOR EACH ROW EXECUTE FUNCTION public.pcs_journal_calibration_retest_on_record_delete();

COMMIT;
