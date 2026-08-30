-- PCS calibration operator DB role grant template v0.3-dev
-- Apply as a migration/admin principal AFTER the fixed roles exist.
-- Replace CURRENT_DATABASE_PLACEHOLDER with the target database identifier.

GRANT CONNECT ON DATABASE CURRENT_DATABASE_PLACEHOLDER TO pcs_calibration_auth;
GRANT CONNECT ON DATABASE CURRENT_DATABASE_PLACEHOLDER TO pcs_calibration_admin;
GRANT CONNECT ON DATABASE CURRENT_DATABASE_PLACEHOLDER TO pcs_calibration_export_control;
GRANT CONNECT ON DATABASE CURRENT_DATABASE_PLACEHOLDER TO pcs_calibration_privacy_control;

GRANT USAGE ON SCHEMA public TO pcs_calibration_auth;
GRANT USAGE ON SCHEMA public TO pcs_calibration_admin;
GRANT USAGE ON SCHEMA public TO pcs_calibration_export_control;
GRANT USAGE ON SCHEMA public TO pcs_calibration_privacy_control;

REVOKE CREATE ON SCHEMA public FROM pcs_calibration_auth;
REVOKE CREATE ON SCHEMA public FROM pcs_calibration_admin;
REVOKE CREATE ON SCHEMA public FROM pcs_calibration_export_control;
REVOKE CREATE ON SCHEMA public FROM pcs_calibration_privacy_control;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM pcs_calibration_auth;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM pcs_calibration_admin;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM pcs_calibration_export_control;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM pcs_calibration_privacy_control;

REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM pcs_calibration_auth;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM pcs_calibration_admin;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM pcs_calibration_export_control;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM pcs_calibration_privacy_control;

GRANT EXECUTE ON FUNCTION public.pcs_authenticate_calibration_operator(text)
TO pcs_calibration_auth;

GRANT SELECT, INSERT, UPDATE ON TABLE
  calibration_operators
TO pcs_calibration_admin;

GRANT SELECT, INSERT, DELETE ON TABLE
  calibration_operator_roles
TO pcs_calibration_admin;

GRANT EXECUTE ON FUNCTION public.pcs_authenticate_calibration_operator(text)
TO pcs_calibration_export_control;

GRANT EXECUTE ON FUNCTION public.pcs_request_calibration_export(
  text,text,text,text,text,text,text,text,text,text
)
TO pcs_calibration_export_control;

GRANT EXECUTE ON FUNCTION public.pcs_review_calibration_export_request(text,uuid)
TO pcs_calibration_export_control;

GRANT EXECUTE ON FUNCTION public.pcs_decide_calibration_export_request(text,uuid,text)
TO pcs_calibration_export_control;

GRANT EXECUTE ON FUNCTION public.pcs_authenticate_calibration_operator(text)
TO pcs_calibration_privacy_control;

GRANT EXECUTE ON FUNCTION public.pcs_request_calibration_privacy_purge(text,uuid)
TO pcs_calibration_privacy_control;

GRANT EXECUTE ON FUNCTION public.pcs_review_calibration_privacy_purge(text,uuid)
TO pcs_calibration_privacy_control;

GRANT EXECUTE ON FUNCTION public.pcs_decide_calibration_privacy_purge(text,uuid,text)
TO pcs_calibration_privacy_control;

-- pcs_calibration_auth, pcs_calibration_export_control and pcs_calibration_privacy_control have zero direct table privileges.
-- pcs_calibration_admin is limited to operator credential/role lifecycle.
-- No role above receives participant/session/result/answer/consent/materialization access or DDL.
