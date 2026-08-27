BEGIN;

CREATE TABLE rate_limit_buckets (
  bucket_hash char(64) PRIMARY KEY,
  scope text NOT NULL,
  window_start timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rate_limit_bucket_hash_chk CHECK (bucket_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT rate_limit_scope_chk CHECK (scope ~ '^[a-z][a-z0-9-]{2,63}$'),
  CONSTRAINT rate_limit_request_count_chk CHECK (request_count >= 1),
  CONSTRAINT rate_limit_expiry_chk CHECK (expires_at > window_start)
);

CREATE INDEX rate_limit_buckets_expires_idx
  ON rate_limit_buckets(expires_at);

COMMIT;
