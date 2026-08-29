-- PCS calibration operator DB role grant template v0.1-dev
-- Apply as a migration/admin principal AFTER both fixed roles exist.
-- Replace CURRENT_DATABASE_PLACEHOLDER with the target database identifier.

GRANT CONNECT ON DATABASE CURRENT_DATABASE_PLACEHOLDER TO pcs_calibration_auth;
GRANT CONNECT ON DATABASE CURRENT_DATABASE_PLACEHOLDER TO pcs_calibration_admin;

GRANT USAGE ON SCHEMA public TO pcs_calibration_auth;
GRANT USAGE ON SCHEMA public TO pcs_calibration_admin;

REVOKE CREATE ON SCHEMA public FROM pcs_calibration_auth;
REVOKE CREATE ON SCHEMA public FROM pcs_calibration_admin;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM pcs_calibration_auth;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM pcs_calibration_admin;

REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM pcs_calibration_auth;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM pcs_calibration_admin;

GRANT SELECT ON TABLE
  calibration_operators,
  calibration_operator_roles
TO pcs_calibration_auth;

GRANT SELECT, INSERT, UPDATE ON TABLE
  calibration_operators
TO pcs_calibration_admin;

GRANT SELECT, INSERT, DELETE ON TABLE
  calibration_operator_roles
TO pcs_calibration_admin;

-- Neither role receives access to participant/session/result/answer/consent/export/audit/link/deletion tables.
-- Neither role receives CREATE/ALTER/DROP/ROLE/EXTENSION privileges.
-- Raw calibration materialization remains unavailable.
