BEGIN;

CREATE OR REPLACE FUNCTION pcs_prevent_revision_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'versioned revision rows are immutable; create a new revision instead';
END;
$$;

CREATE TRIGGER trait_definition_revisions_immutable
BEFORE UPDATE OR DELETE ON trait_definition_revisions
FOR EACH ROW EXECUTE FUNCTION pcs_prevent_revision_mutation();

CREATE TRIGGER assessment_item_revisions_immutable
BEFORE UPDATE OR DELETE ON assessment_item_revisions
FOR EACH ROW EXECUTE FUNCTION pcs_prevent_revision_mutation();

CREATE OR REPLACE FUNCTION pcs_protect_published_model_items()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP <> 'INSERT' AND EXISTS (
    SELECT 1 FROM assessment_model_releases
    WHERE model_version = OLD.model_version AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'items belonging to a published assessment model are immutable';
  END IF;

  IF TG_OP <> 'DELETE' AND EXISTS (
    SELECT 1 FROM assessment_model_releases
    WHERE model_version = NEW.model_version AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'items belonging to a published assessment model are immutable';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER assessment_model_items_published_guard
BEFORE INSERT OR UPDATE OR DELETE ON assessment_model_items
FOR EACH ROW EXECUTE FUNCTION pcs_protect_published_model_items();

CREATE OR REPLACE FUNCTION pcs_protect_published_content_version()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION 'published content_versions are immutable';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER content_version_immutable_update
BEFORE UPDATE ON content_versions
FOR EACH ROW EXECUTE FUNCTION pcs_protect_published_content_version();

CREATE TRIGGER content_version_immutable_delete
BEFORE DELETE ON content_versions
FOR EACH ROW EXECUTE FUNCTION pcs_protect_published_content_version();

CREATE OR REPLACE FUNCTION pcs_protect_published_content_modules()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP <> 'INSERT' AND EXISTS (
    SELECT 1 FROM content_versions
    WHERE content_version = OLD.content_version AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'modules belonging to a published content version are immutable';
  END IF;

  IF TG_OP <> 'DELETE' AND EXISTS (
    SELECT 1 FROM content_versions
    WHERE content_version = NEW.content_version AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'modules belonging to a published content version are immutable';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER content_modules_published_guard
BEFORE INSERT OR UPDATE OR DELETE ON content_modules
FOR EACH ROW EXECUTE FUNCTION pcs_protect_published_content_modules();

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

CREATE TRIGGER assessment_answers_session_model_guard
BEFORE INSERT OR UPDATE OR DELETE ON assessment_answers
FOR EACH ROW EXECUTE FUNCTION pcs_validate_assessment_answer();

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

CREATE TRIGGER assessment_trait_scores_session_model_guard
BEFORE INSERT OR UPDATE OR DELETE ON assessment_trait_scores
FOR EACH ROW EXECUTE FUNCTION pcs_validate_trait_score();

CREATE OR REPLACE FUNCTION pcs_validate_result_snapshot_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  session_model text;
  session_locale text;
  session_status text;
  expected_item_bank_version text;
  expected_scoring_version text;
  expected_code_schema_version text;
  expected_interaction_version text;
  expected_content_version text;
BEGIN
  SELECT s.model_version, s.locale, s.status,
         m.item_bank_version, m.scoring_version, m.code_schema_version,
         m.interaction_version, m.content_version
    INTO session_model, session_locale, session_status,
         expected_item_bank_version, expected_scoring_version, expected_code_schema_version,
         expected_interaction_version, expected_content_version
  FROM anonymous_sessions s
  JOIN assessment_model_releases m ON m.model_version = s.model_version
  WHERE s.session_id = NEW.session_id;

  IF session_status IS NULL THEN
    RAISE EXCEPTION 'anonymous session does not exist';
  END IF;

  IF session_status <> 'in_progress' THEN
    RAISE EXCEPTION 'result snapshot must be created before session completion';
  END IF;

  IF NEW.assessment_model_version <> session_model
     OR NEW.item_bank_version <> expected_item_bank_version
     OR NEW.scoring_version <> expected_scoring_version
     OR NEW.code_schema_version <> expected_code_schema_version
     OR NEW.interaction_version <> expected_interaction_version
     OR NEW.content_version <> expected_content_version
     OR NEW.locale <> session_locale THEN
    RAISE EXCEPTION 'result snapshot version/locale columns do not match the session model';
  END IF;

  IF NEW.snapshot_json ->> 'snapshotSchemaVersion' IS DISTINCT FROM NEW.snapshot_schema_version
     OR NEW.snapshot_json #>> '{versions,assessmentModelVersion}' IS DISTINCT FROM NEW.assessment_model_version
     OR NEW.snapshot_json #>> '{versions,itemBankVersion}' IS DISTINCT FROM NEW.item_bank_version
     OR NEW.snapshot_json #>> '{versions,scoringVersion}' IS DISTINCT FROM NEW.scoring_version
     OR NEW.snapshot_json #>> '{versions,codeSchemaVersion}' IS DISTINCT FROM NEW.code_schema_version
     OR NEW.snapshot_json #>> '{versions,interactionVersion}' IS DISTINCT FROM NEW.interaction_version
     OR NEW.snapshot_json #>> '{versions,contentVersion}' IS DISTINCT FROM NEW.content_version
     OR NEW.snapshot_json ->> 'locale' IS DISTINCT FROM NEW.locale THEN
    RAISE EXCEPTION 'result snapshot JSON metadata does not match indexed snapshot columns';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER result_snapshots_version_guard
BEFORE INSERT ON result_snapshots
FOR EACH ROW EXECUTE FUNCTION pcs_validate_result_snapshot_insert();

CREATE OR REPLACE FUNCTION pcs_validate_session_completion()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'completed' THEN
    RAISE EXCEPTION 'completed anonymous sessions are immutable; delete under retention/privacy policy';
  END IF;

  IF NEW.status = 'completed' THEN
    IF NEW.completed_at IS NULL THEN
      RAISE EXCEPTION 'completed_at is required when completing a session';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM assessment_model_items mi
      WHERE mi.model_version = NEW.model_version
        AND mi.required
        AND NOT EXISTS (
          SELECT 1 FROM assessment_answers a
          WHERE a.session_id = NEW.session_id
            AND a.item_id = mi.item_id
            AND a.item_revision = mi.item_revision
            AND a.locale = mi.locale
        )
    ) THEN
      RAISE EXCEPTION 'cannot complete session with missing required answers';
    END IF;

    IF EXISTS (
      SELECT DISTINCT mi.trait_id
      FROM assessment_model_items mi
      WHERE mi.model_version = NEW.model_version
        AND NOT EXISTS (
          SELECT 1 FROM assessment_trait_scores s
          WHERE s.session_id = NEW.session_id
            AND s.trait_id = mi.trait_id
        )
    ) THEN
      RAISE EXCEPTION 'cannot complete session with missing trait scores';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM result_snapshots r WHERE r.session_id = NEW.session_id
    ) THEN
      RAISE EXCEPTION 'cannot complete session without immutable result snapshot';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER anonymous_sessions_completion_guard
BEFORE UPDATE ON anonymous_sessions
FOR EACH ROW EXECUTE FUNCTION pcs_validate_session_completion();

COMMIT;
