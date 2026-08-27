BEGIN;

CREATE OR REPLACE FUNCTION pcs_validate_result_snapshot_asset_linkage()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  asset_version text;
BEGIN
  IF NEW.snapshot_schema_version = 'result-snapshot-v0.2-dev' THEN
    asset_version := NEW.snapshot_json #>> '{assets,illustrationAssetVersion}';
    IF asset_version IS NULL OR length(asset_version) = 0 THEN
      RAISE EXCEPTION 'result-snapshot-v0.2-dev requires illustration asset version';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER result_snapshots_asset_linkage_guard
BEFORE INSERT ON result_snapshots
FOR EACH ROW
EXECUTE FUNCTION pcs_validate_result_snapshot_asset_linkage();

CREATE OR REPLACE FUNCTION pcs_validate_public_share_asset_linkage()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  source_asset text;
  share_asset text;
BEGIN
  share_asset := NEW.share_json #>> '{presentation,illustrationAssetVersion}';

  IF NEW.source_result_snapshot_id IS NOT NULL THEN
    SELECT snapshot_json #>> '{assets,illustrationAssetVersion}'
      INTO source_asset
    FROM result_snapshots
    WHERE snapshot_id = NEW.source_result_snapshot_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'source result snapshot not found for asset linkage';
    END IF;

    IF source_asset IS NULL AND share_asset IS NOT NULL THEN
      RAISE EXCEPTION 'public share cannot add illustration asset absent from source snapshot';
    END IF;

    IF source_asset IS NOT NULL AND share_asset IS DISTINCT FROM source_asset THEN
      RAISE EXCEPTION 'public share illustration asset version does not match source result snapshot';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER public_share_snapshots_asset_linkage_guard
BEFORE INSERT ON public_share_snapshots
FOR EACH ROW
EXECUTE FUNCTION pcs_validate_public_share_asset_linkage();

COMMIT;
