BEGIN;

CREATE OR REPLACE FUNCTION pcs_validate_assessment_answer()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  target_session_id uuid;
  session_model text;
  session_locale text;
  session_status text;
  session_completed_at timestamptz;
BEGIN
  target_session_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.session_id ELSE NEW.session_id END;

  SELECT model_version, locale, status, completed_at
    INTO session_model, session_locale, session_status, session_completed_at
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

  -- Raw answers have a shorter engineering retention window than private results.
  -- Permit direct answer deletion only after the completed-session age itself has
  -- crossed 90 days. UPDATE remains prohibited, and younger completed rows stay
  -- immutable. A policy-window change requires a new migration plus policy version.
  IF TG_OP = 'DELETE'
     AND session_status = 'completed'
     AND session_completed_at IS NOT NULL
     AND session_completed_at <= now() - interval '90 days' THEN
    RETURN OLD;
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

COMMIT;
