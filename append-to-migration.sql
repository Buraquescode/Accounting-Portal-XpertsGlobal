
-- ============================================================================
-- Hand-written additions (appended after the Prisma generated SQL)
-- ============================================================================

-- 1) Money must be positive.
ALTER TABLE "requests"
  ADD CONSTRAINT "requests_amount_positive" CHECK ("amount" > 0);

-- 2) The audit log is append-only: the database itself refuses UPDATE, DELETE and TRUNCATE,
--    so even a bug in the API or a person with SQL access cannot rewrite history by accident.
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'request_audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER request_audit_logs_no_update_delete
BEFORE UPDATE OR DELETE ON "request_audit_logs"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TRIGGER request_audit_logs_no_truncate
BEFORE TRUNCATE ON "request_audit_logs"
FOR EACH STATEMENT EXECUTE FUNCTION prevent_audit_log_mutation();
