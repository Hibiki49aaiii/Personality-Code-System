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

CREATE TABLE public.calibration_retest_linkages (
  retest_pair_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baseline_calibration_record_id uuid NOT NULL
    REFERENCES public.calibration_record_links(calibration_record_id) ON DELETE CASCADE,
  retest_calibration_record_id uuid
    REFERENCES public.calibration_record_links(calibration_record_id) ON DELETE CASCADE,
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
  baseline_completed_at timestamptz;
  baseline_consent_status text;
  baseline_consent_version text;
  baseline_purpose_id text;
  baseline_model text;
  baseline_locale text;
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
    s.completed_at,
    c.status,
    c.consent_version,
    c.purpose_id,
    s.model_version,
    s.locale
  INTO
    baseline_completed_at,
    baseline_consent_status,
    baseline_consent_version,
    baseline_purpose_id,
    baseline_model,
    baseline_locale
  FROM public.calibration_record_links l
  JOIN public.calibration_consent_receipts c
    ON c.consent_receipt_id = l.consent_receipt_id
  JOIN public.anonymous_sessions s
    ON s.session_id = c.session_id
  WHERE l.calibration_record_id = NEW.baseline_calibration_record_id
    AND s.status = 'completed';

  IF baseline_completed_at IS NULL
     OR baseline_consent_status <> 'granted'
     OR baseline_consent_version <> 'calibration-consent-ja-v0.1-dev'
     OR baseline_purpose_id <> 'psychometric-calibration-v0.1'
     OR baseline_model <> NEW.assessment_model_version
     OR baseline_locale <> NEW.locale THEN
    RAISE EXCEPTION 'calibration retest baseline lineage invalid';
  END IF;

  IF NEW.eligible_from <> baseline_completed_at + interval '14 days'
     OR NEW.eligible_until <> baseline_completed_at + interval '21 days' THEN
    RAISE EXCEPTION 'calibration retest eligibility window mismatch';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_retest_linkage_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  retest_completed_at timestamptz;
  retest_consent_status text;
  retest_consent_version text;
  retest_purpose_id text;
  retest_model text;
  retest_locale text;
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

    SELECT
      s.completed_at,
      c.status,
      c.consent_version,
      c.purpose_id,
      s.model_version,
      s.locale
    INTO
      retest_completed_at,
      retest_consent_status,
      retest_consent_version,
      retest_purpose_id,
      retest_model,
      retest_locale
    FROM public.calibration_record_links l
    JOIN public.calibration_consent_receipts c
      ON c.consent_receipt_id = l.consent_receipt_id
    JOIN public.anonymous_sessions s
      ON s.session_id = c.session_id
    WHERE l.calibration_record_id = NEW.retest_calibration_record_id
      AND s.status = 'completed';

    IF retest_completed_at IS NULL
       OR retest_consent_status <> 'granted'
       OR retest_consent_version <> 'calibration-retest-consent-ja-v0.1-dev'
       OR retest_purpose_id <> 'psychometric-calibration-retest-v0.1'
       OR retest_model <> NEW.assessment_model_version
       OR retest_locale <> NEW.locale THEN
      RAISE EXCEPTION 'calibration retest claim lineage invalid';
    END IF;

    IF retest_completed_at < NEW.eligible_from
       OR retest_completed_at > NEW.eligible_until THEN
      RAISE EXCEPTION 'calibration retest completion outside eligibility window';
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

CREATE TRIGGER calibration_retest_linkages_insert_guard
BEFORE INSERT ON public.calibration_retest_linkages
FOR EACH ROW EXECUTE FUNCTION public.pcs_validate_calibration_retest_linkage_insert();

CREATE TRIGGER calibration_retest_linkages_update_guard
BEFORE UPDATE ON public.calibration_retest_linkages
FOR EACH ROW EXECUTE FUNCTION public.pcs_validate_calibration_retest_linkage_update();

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

CREATE TRIGGER calibration_retest_consent_withdrawal_invalidation
AFTER UPDATE OF status ON public.calibration_consent_receipts
FOR EACH ROW EXECUTE FUNCTION public.pcs_invalidate_calibration_retest_on_consent_withdrawal();

CREATE OR REPLACE FUNCTION public.pcs_journal_calibration_retest_on_record_link_delete()
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

CREATE TRIGGER calibration_retest_record_link_delete_journal
BEFORE DELETE ON public.calibration_record_links
FOR EACH ROW EXECUTE FUNCTION public.pcs_journal_calibration_retest_on_record_link_delete();

COMMIT;
