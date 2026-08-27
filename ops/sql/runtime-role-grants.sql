-- PCS runtime-role grant template v0.1-dev
-- Apply as a migration/admin principal AFTER the runtime role exists.
-- The role name is intentionally fixed in this reviewable template; deployments
-- may use a provider-specific equivalent only if evidence maps it back to the
-- machine-readable policy.

GRANT CONNECT ON DATABASE CURRENT_DATABASE_PLACEHOLDER TO pcs_runtime;
GRANT USAGE ON SCHEMA public TO pcs_runtime;
REVOKE CREATE ON SCHEMA public FROM pcs_runtime;

GRANT SELECT ON TABLE
  trait_definitions,
  trait_definition_revisions,
  assessment_items,
  assessment_item_revisions,
  assessment_model_releases,
  assessment_model_items,
  content_versions,
  content_modules,
  illustration_assets
TO pcs_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  anonymous_sessions,
  assessment_answers
TO pcs_runtime;

GRANT SELECT, INSERT ON TABLE
  assessment_trait_scores,
  result_snapshots
TO pcs_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public_share_snapshots,
  rate_limit_buckets
TO pcs_runtime;

GRANT SELECT, INSERT, DELETE ON TABLE
  product_events
TO pcs_runtime;

-- No CREATE/ALTER/DROP/ROLE/EXTENSION grants belong to the runtime role.
-- Versioned product/model/content definition tables are read-only at runtime.
