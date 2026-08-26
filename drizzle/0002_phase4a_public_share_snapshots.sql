BEGIN;

CREATE TABLE public_share_snapshots (
  share_snapshot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_token_hash char(64) NOT NULL,
  source_result_snapshot_id uuid REFERENCES result_snapshots(snapshot_id) ON DELETE SET NULL,
  share_schema_version text NOT NULL,
  assessment_model_version text NOT NULL REFERENCES assessment_model_releases(model_version) ON DELETE RESTRICT,
  code_schema_version text NOT NULL,
  content_version text NOT NULL REFERENCES content_versions(content_version) ON DELETE RESTRICT,
  locale text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  share_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  expires_at timestamptz,
  CONSTRAINT public_share_snapshot_token_hash_chk CHECK (public_token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT public_share_snapshot_status_chk CHECK (status IN ('active','revoked','expired')),
  CONSTRAINT public_share_snapshot_revocation_chk CHECK (status <> 'revoked' OR revoked_at IS NOT NULL)
);

CREATE UNIQUE INDEX public_share_snapshots_token_hash_uq
  ON public_share_snapshots(public_token_hash);

CREATE INDEX public_share_snapshots_source_idx
  ON public_share_snapshots(source_result_snapshot_id);

CREATE INDEX public_share_snapshots_created_at_idx
  ON public_share_snapshots(created_at);

CREATE INDEX public_share_snapshots_expiry_idx
  ON public_share_snapshots(expires_at);

CREATE OR REPLACE FUNCTION pcs_public_share_snapshot_insert_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  source_model text;
  source_code_schema text;
  source_content text;
  source_locale text;
  source_core_code text;
BEGIN
  IF NEW.status <> 'active' THEN
    RAISE EXCEPTION 'new public share snapshot must start active';
  END IF;

  IF NEW.share_json ?| ARRAY[
    'traitScores',
    'responseQuality',
    'interactionActiveIds',
    'personalityCode',
    'sections',
    'answers',
    'sessionToken',
    'sessionId'
  ] THEN
    RAISE EXCEPTION 'public share snapshot contains a prohibited diagnostic/private field';
  END IF;

  IF NEW.share_json->>'shareSchemaVersion' IS DISTINCT FROM NEW.share_schema_version THEN
    RAISE EXCEPTION 'public share shareSchemaVersion mismatch';
  END IF;
  IF NEW.share_json->>'locale' IS DISTINCT FROM NEW.locale THEN
    RAISE EXCEPTION 'public share locale mismatch';
  END IF;
  IF NEW.share_json->'versions'->>'assessmentModelVersion' IS DISTINCT FROM NEW.assessment_model_version THEN
    RAISE EXCEPTION 'public share assessment model version mismatch';
  END IF;
  IF NEW.share_json->'versions'->>'codeSchemaVersion' IS DISTINCT FROM NEW.code_schema_version THEN
    RAISE EXCEPTION 'public share code schema version mismatch';
  END IF;
  IF NEW.share_json->'versions'->>'contentVersion' IS DISTINCT FROM NEW.content_version THEN
    RAISE EXCEPTION 'public share content version mismatch';
  END IF;
  IF COALESCE(NEW.share_json->>'coreCode', '') !~ '^[A-Z0-9]{2,32}$' THEN
    RAISE EXCEPTION 'public share core code missing/invalid';
  END IF;

  IF NEW.source_result_snapshot_id IS NOT NULL THEN
    SELECT
      assessment_model_version,
      code_schema_version,
      content_version,
      locale,
      snapshot_json->'personalityCode'->>'coreCode'
    INTO
      source_model,
      source_code_schema,
      source_content,
      source_locale,
      source_core_code
    FROM result_snapshots
    WHERE snapshot_id = NEW.source_result_snapshot_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'source result snapshot not found';
    END IF;
    IF source_model IS DISTINCT FROM NEW.assessment_model_version
      OR source_code_schema IS DISTINCT FROM NEW.code_schema_version
      OR source_content IS DISTINCT FROM NEW.content_version
      OR source_locale IS DISTINCT FROM NEW.locale
      OR source_core_code IS DISTINCT FROM NEW.share_json->>'coreCode' THEN
      RAISE EXCEPTION 'public share snapshot does not match source result snapshot';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER public_share_snapshots_insert_guard
BEFORE INSERT ON public_share_snapshots
FOR EACH ROW
EXECUTE FUNCTION pcs_public_share_snapshot_insert_guard();

CREATE OR REPLACE FUNCTION pcs_public_share_snapshot_update_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.share_snapshot_id IS DISTINCT FROM OLD.share_snapshot_id
    OR NEW.public_token_hash IS DISTINCT FROM OLD.public_token_hash
    OR NEW.share_schema_version IS DISTINCT FROM OLD.share_schema_version
    OR NEW.assessment_model_version IS DISTINCT FROM OLD.assessment_model_version
    OR NEW.code_schema_version IS DISTINCT FROM OLD.code_schema_version
    OR NEW.content_version IS DISTINCT FROM OLD.content_version
    OR NEW.locale IS DISTINCT FROM OLD.locale
    OR NEW.share_json IS DISTINCT FROM OLD.share_json
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    OR NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
    RAISE EXCEPTION 'public share snapshot payload/version identity is immutable';
  END IF;

  -- ON DELETE SET NULL from the private source result is allowed. Rebinding is not.
  IF OLD.source_result_snapshot_id IS NULL AND NEW.source_result_snapshot_id IS NOT NULL THEN
    RAISE EXCEPTION 'detached public share snapshot cannot be rebound';
  END IF;
  IF OLD.source_result_snapshot_id IS NOT NULL
    AND NEW.source_result_snapshot_id IS NOT NULL
    AND NEW.source_result_snapshot_id IS DISTINCT FROM OLD.source_result_snapshot_id THEN
    RAISE EXCEPTION 'public share snapshot cannot change source result';
  END IF;

  IF OLD.status = 'revoked' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'revoked public share snapshot cannot be reactivated';
  END IF;
  IF OLD.status = 'expired' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'expired public share snapshot cannot be reactivated';
  END IF;
  IF OLD.status = 'active' AND NEW.status NOT IN ('active','revoked','expired') THEN
    RAISE EXCEPTION 'invalid public share status transition';
  END IF;
  IF NEW.status = 'revoked' AND NEW.revoked_at IS NULL THEN
    RAISE EXCEPTION 'revoked public share snapshot requires revoked_at';
  END IF;
  IF OLD.revoked_at IS NOT NULL AND NEW.revoked_at IS DISTINCT FROM OLD.revoked_at THEN
    RAISE EXCEPTION 'public share revoked_at is immutable once set';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER public_share_snapshots_update_guard
BEFORE UPDATE ON public_share_snapshots
FOR EACH ROW
EXECUTE FUNCTION pcs_public_share_snapshot_update_guard();

COMMIT;
