BEGIN;

-- The application uses Render as its public API. Keep the underlying tables
-- unavailable to Supabase's anon/authenticated Data API roles.
REVOKE ALL PRIVILEGES
  ON TABLE public.users, public.appointments, public.push_device_tokens
  FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES
  ON ALL SEQUENCES IN SCHEMA public
  FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT, UPDATE
  ON SEQUENCES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- Expose only this narrow, server-only surface through Supabase Data API.
CREATE SCHEMA IF NOT EXISTS reminder_api;

REVOKE ALL ON SCHEMA reminder_api FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA reminder_api
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

CREATE OR REPLACE FUNCTION reminder_api.claim_due_appointment_reminders(
  p_claim_token UUID,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  appointment_id BIGINT,
  client_user_id BIGINT,
  appointment_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  SELECT *
  FROM public.claim_due_appointment_reminders(p_claim_token, p_limit);
$function$;

CREATE OR REPLACE FUNCTION reminder_api.get_claimed_appointment_device_tokens(
  p_appointment_id BIGINT,
  p_claim_token UUID
)
RETURNS TABLE (
  id BIGINT,
  expo_push_token TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  SELECT
    device.id,
    device.expo_push_token
  FROM public.appointments AS appointment
  INNER JOIN public.push_device_tokens AS device
    ON device.user_id = appointment.user_id
  WHERE appointment.id = p_appointment_id
    AND appointment.reminder_claim_token = p_claim_token
    AND appointment.reminder_claimed_at IS NOT NULL
    AND appointment.reminder_sent_at IS NULL
    AND device.active = TRUE
  ORDER BY device.id;
$function$;

CREATE OR REPLACE FUNCTION reminder_api.deactivate_claimed_device_token(
  p_appointment_id BIGINT,
  p_claim_token UUID,
  p_token_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  WITH updated AS (
    UPDATE public.push_device_tokens AS device
    SET
      active = FALSE,
      updated_at = NOW()
    FROM public.appointments AS appointment
    WHERE appointment.id = p_appointment_id
      AND appointment.reminder_claim_token = p_claim_token
      AND appointment.reminder_claimed_at IS NOT NULL
      AND appointment.reminder_sent_at IS NULL
      AND device.id = p_token_id
      AND device.user_id = appointment.user_id
    RETURNING device.id
  )
  SELECT EXISTS (SELECT 1 FROM updated);
$function$;

CREATE OR REPLACE FUNCTION reminder_api.mark_appointment_reminder_sent(
  p_appointment_id BIGINT,
  p_claim_token UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  SELECT public.mark_appointment_reminder_sent(
    p_appointment_id,
    p_claim_token
  );
$function$;

CREATE OR REPLACE FUNCTION reminder_api.release_appointment_reminder_claim(
  p_appointment_id BIGINT,
  p_claim_token UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  SELECT public.release_appointment_reminder_claim(
    p_appointment_id,
    p_claim_token
  );
$function$;

REVOKE ALL ON FUNCTION
  reminder_api.claim_due_appointment_reminders(UUID, INTEGER),
  reminder_api.get_claimed_appointment_device_tokens(BIGINT, UUID),
  reminder_api.deactivate_claimed_device_token(BIGINT, UUID, BIGINT),
  reminder_api.mark_appointment_reminder_sent(BIGINT, UUID),
  reminder_api.release_appointment_reminder_claim(BIGINT, UUID)
  FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA reminder_api TO service_role;

GRANT EXECUTE ON FUNCTION
  reminder_api.claim_due_appointment_reminders(UUID, INTEGER),
  reminder_api.get_claimed_appointment_device_tokens(BIGINT, UUID),
  reminder_api.deactivate_claimed_device_token(BIGINT, UUID, BIGINT),
  reminder_api.mark_appointment_reminder_sent(BIGINT, UUID),
  reminder_api.release_appointment_reminder_claim(BIGINT, UUID)
  TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
