BEGIN;

CREATE OR REPLACE FUNCTION pcs_validate_assessment_answer()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  target_session_id uuid;
  session_model text;
  session_locale text;
  session_status text;
BEGIN
  target_session_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.session_id ELSE NEW.session_id END;

  SELECT model_version, locale, status
    INTO session_model, session_locale, session_status
  FROM anonymous_sessions
  WHERE session_id = target_session_id;

  -- During ON DELETE CASCADE from anonymous_sessions, the parent row is no longer
  -- visible to this child-row trigger. Permit only that parent-absence DELETE path.
  IF TG_OP = 'DELETE' AND session_status IS NULL THEN
    RETURN OLD;
  END IF;

  IF session_status IS NULL THEN
    RAISE EXCEPTION 'anonymous session does not exist';
  END IF;

  IF session_status <> 'in_progress' THEN
    RAISE EXCEPTION 'answers may only change while a session is in_progress';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  IF NEW.locale <> session_locale THEN
    RAISE EXCEPTION 'answer locale does not match session locale';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM assessment_model_items
    WHERE model_version = session_model
      AND item_id = NEW.item_id
      AND item_revision = NEW.item_revision
      AND locale = NEW.locale
  ) THEN
    RAISE EXCEPTION 'answer item/revision is not part of the session assessment model';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION pcs_validate_trait_score()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  target_session_id uuid;
  session_model text;
  session_status text;
  expected_scoring_version text;
BEGIN
  target_session_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.session_id ELSE NEW.session_id END;

  SELECT s.model_version, s.status, m.scoring_version
    INTO session_model, session_status, expected_scoring_version
  FROM anonymous_sessions s
  JOIN assessment_model_releases m ON m.model_version = s.model_version
  WHERE s.session_id = target_session_id;

  -- Preserve completed-session immutability for direct child deletion while
  -- allowing the owning anonymous session itself to be privacy-deleted.
  IF TG_OP = 'DELETE' AND session_status IS NULL THEN
    RETURN OLD;
  END IF;

  IF session_status IS NULL THEN
    RAISE EXCEPTION 'anonymous session does not exist';
  END IF;

  IF session_status <> 'in_progress' THEN
    RAISE EXCEPTION 'trait scores may only change while a session is in_progress';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  IF NEW.scoring_version <> expected_scoring_version THEN
    RAISE EXCEPTION 'trait score scoring_version does not match session model';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM assessment_model_items
    WHERE model_version = session_model AND trait_id = NEW.trait_id
  ) THEN
    RAISE EXCEPTION 'trait score trait is not represented by the session assessment model';
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
