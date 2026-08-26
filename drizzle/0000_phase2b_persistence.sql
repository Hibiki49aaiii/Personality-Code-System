BEGIN;

CREATE TABLE trait_definitions (
  trait_id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE trait_definition_revisions (
  trait_id text NOT NULL REFERENCES trait_definitions(trait_id) ON DELETE RESTRICT,
  dictionary_version text NOT NULL,
  locale text NOT NULL,
  display_name text NOT NULL,
  definition text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trait_id, dictionary_version, locale)
);

CREATE TABLE assessment_items (
  item_id text PRIMARY KEY,
  primary_trait_id text NOT NULL REFERENCES trait_definitions(trait_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assessment_item_revisions (
  item_id text NOT NULL REFERENCES assessment_items(item_id) ON DELETE RESTRICT,
  revision text NOT NULL,
  locale text NOT NULL,
  text text NOT NULL,
  rationale text NOT NULL,
  lifecycle_status text NOT NULL,
  introduced_item_bank_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, revision, locale),
  CONSTRAINT assessment_item_revision_status_chk CHECK (lifecycle_status IN ('draft','reviewed','beta','active','retired'))
);

CREATE TABLE assessment_model_releases (
  model_version text PRIMARY KEY,
  status text NOT NULL,
  locale text NOT NULL,
  trait_dictionary_version text NOT NULL,
  item_bank_version text NOT NULL,
  scoring_version text NOT NULL,
  code_schema_version text NOT NULL,
  interaction_version text NOT NULL,
  content_version text NOT NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assessment_model_release_status_chk CHECK (status IN ('draft','beta','published','retired')),
  CONSTRAINT assessment_model_publish_time_chk CHECK (status <> 'published' OR published_at IS NOT NULL)
);

CREATE TABLE assessment_model_items (
  model_version text NOT NULL REFERENCES assessment_model_releases(model_version) ON DELETE RESTRICT,
  position integer NOT NULL,
  item_id text NOT NULL,
  item_revision text NOT NULL,
  locale text NOT NULL,
  trait_id text NOT NULL REFERENCES trait_definitions(trait_id) ON DELETE RESTRICT,
  direction integer NOT NULL,
  weight_milli integer NOT NULL,
  required boolean NOT NULL DEFAULT true,
  PRIMARY KEY (model_version, position),
  CONSTRAINT assessment_model_items_revision_fk FOREIGN KEY (item_id, item_revision, locale)
    REFERENCES assessment_item_revisions(item_id, revision, locale) ON DELETE RESTRICT,
  CONSTRAINT assessment_model_items_position_chk CHECK (position > 0),
  CONSTRAINT assessment_model_items_direction_chk CHECK (direction IN (-1,1)),
  CONSTRAINT assessment_model_items_weight_chk CHECK (weight_milli > 0)
);
CREATE UNIQUE INDEX assessment_model_items_identity_uq ON assessment_model_items(model_version, item_id);

CREATE TABLE content_versions (
  content_version text PRIMARY KEY,
  locale text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_version_status_chk CHECK (status IN ('draft','beta','published','retired'))
);

CREATE TABLE content_modules (
  content_version text NOT NULL REFERENCES content_versions(content_version) ON DELETE RESTRICT,
  module_id text NOT NULL,
  domain text NOT NULL,
  priority integer NOT NULL,
  module_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_version, module_id)
);

CREATE TABLE illustration_assets (
  asset_version text PRIMARY KEY,
  asset_key text NOT NULL,
  storage_ref text NOT NULL,
  metadata_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE anonymous_sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token_hash char(64) NOT NULL,
  model_version text NOT NULL REFERENCES assessment_model_releases(model_version) ON DELETE RESTRICT,
  locale text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  CONSTRAINT anonymous_session_status_chk CHECK (status IN ('in_progress','completed','expired')),
  CONSTRAINT anonymous_session_completion_chk CHECK (status <> 'completed' OR completed_at IS NOT NULL)
);
CREATE UNIQUE INDEX anonymous_sessions_access_token_hash_uq ON anonymous_sessions(access_token_hash);
CREATE INDEX anonymous_sessions_expiry_idx ON anonymous_sessions(expires_at);

CREATE TABLE assessment_answers (
  session_id uuid NOT NULL REFERENCES anonymous_sessions(session_id) ON DELETE CASCADE,
  item_id text NOT NULL,
  item_revision text NOT NULL,
  locale text NOT NULL,
  value integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, item_id),
  CONSTRAINT assessment_answers_revision_fk FOREIGN KEY (item_id, item_revision, locale)
    REFERENCES assessment_item_revisions(item_id, revision, locale) ON DELETE RESTRICT,
  CONSTRAINT assessment_answer_value_chk CHECK (value BETWEEN 1 AND 5)
);

CREATE TABLE assessment_trait_scores (
  session_id uuid NOT NULL REFERENCES anonymous_sessions(session_id) ON DELETE CASCADE,
  trait_id text NOT NULL REFERENCES trait_definitions(trait_id) ON DELETE RESTRICT,
  scoring_version text NOT NULL,
  score_bp integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, trait_id),
  CONSTRAINT assessment_trait_score_bp_chk CHECK (score_bp BETWEEN 0 AND 10000)
);

CREATE TABLE result_snapshots (
  snapshot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES anonymous_sessions(session_id) ON DELETE CASCADE,
  snapshot_schema_version text NOT NULL,
  assessment_model_version text NOT NULL REFERENCES assessment_model_releases(model_version) ON DELETE RESTRICT,
  item_bank_version text NOT NULL,
  scoring_version text NOT NULL,
  code_schema_version text NOT NULL,
  interaction_version text NOT NULL,
  content_version text NOT NULL REFERENCES content_versions(content_version) ON DELETE RESTRICT,
  locale text NOT NULL,
  snapshot_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX result_snapshots_session_uq ON result_snapshots(session_id);
CREATE INDEX result_snapshots_model_idx ON result_snapshots(assessment_model_version);
CREATE INDEX result_snapshots_created_at_idx ON result_snapshots(created_at);

CREATE OR REPLACE FUNCTION pcs_prevent_result_snapshot_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'result_snapshots are immutable; insert a new versioned snapshot or delete under retention/privacy policy';
END;
$$;

CREATE TRIGGER result_snapshots_immutable_update
BEFORE UPDATE ON result_snapshots
FOR EACH ROW EXECUTE FUNCTION pcs_prevent_result_snapshot_update();

CREATE OR REPLACE FUNCTION pcs_protect_published_model_release()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION 'published assessment_model_releases are immutable';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER assessment_model_release_immutable_update
BEFORE UPDATE ON assessment_model_releases
FOR EACH ROW EXECUTE FUNCTION pcs_protect_published_model_release();

CREATE TRIGGER assessment_model_release_immutable_delete
BEFORE DELETE ON assessment_model_releases
FOR EACH ROW EXECUTE FUNCTION pcs_protect_published_model_release();

COMMIT;
