BEGIN;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS client_attendance_confirmed_at TIMESTAMPTZ;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_claimed_at TIMESTAMPTZ;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_claim_token UUID;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_attempts INTEGER NOT NULL DEFAULT 0;

DO $constraints$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.appointments'::REGCLASS
      AND conname = 'appointments_reminder_claim_consistent'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_reminder_claim_consistent
      CHECK (
        (reminder_claimed_at IS NULL) = (reminder_claim_token IS NULL)
      );
  END IF;
END;
$constraints$;

CREATE TABLE IF NOT EXISTS public.push_device_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL
    REFERENCES public.users(id)
    ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL
    CHECK (platform IN ('android', 'ios')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT push_device_tokens_token_not_blank
    CHECK (LENGTH(BTRIM(expo_push_token)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_device_tokens_token
  ON public.push_device_tokens (expo_push_token);

CREATE INDEX IF NOT EXISTS idx_push_device_tokens_active_user
  ON public.push_device_tokens (user_id)
  WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_appointments_due_reminders
  ON public.appointments (appointment_date, appointment_time)
  WHERE status = 'ACCEPTED'
    AND client_attendance_confirmed_at IS NULL
    AND reminder_sent_at IS NULL;

ALTER TABLE public.push_device_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.push_device_tokens FROM PUBLIC;
REVOKE ALL ON SEQUENCE public.push_device_tokens_id_seq FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.claim_due_appointment_reminders(
  p_claim_token UUID,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  appointment_id BIGINT,
  client_user_id BIGINT,
  appointment_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF p_claim_token IS NULL THEN
    RAISE EXCEPTION 'p_claim_token no puede ser NULL';
  END IF;

  RETURN QUERY
  WITH due AS MATERIALIZED (
    SELECT appointment.id
    FROM public.appointments AS appointment
    WHERE appointment.status = 'ACCEPTED'
      AND appointment.client_attendance_confirmed_at IS NULL
      AND appointment.reminder_sent_at IS NULL
      AND (
        appointment.reminder_claimed_at IS NULL
        OR appointment.reminder_claimed_at < NOW() - INTERVAL '5 minutes'
      )
      AND (
        (appointment.appointment_date + appointment.appointment_time)
        AT TIME ZONE 'America/Managua'
      ) > NOW()
      AND (
        (appointment.appointment_date + appointment.appointment_time)
        AT TIME ZONE 'America/Managua'
      ) - INTERVAL '1 hour' <= NOW()
    ORDER BY appointment.appointment_date, appointment.appointment_time
    FOR UPDATE OF appointment SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500)
  )
  UPDATE public.appointments AS appointment
  SET
    reminder_claimed_at = NOW(),
    reminder_claim_token = p_claim_token,
    reminder_attempts = appointment.reminder_attempts + 1
  FROM due
  WHERE appointment.id = due.id
  RETURNING
    appointment.id,
    appointment.user_id,
    (
      (appointment.appointment_date + appointment.appointment_time)
      AT TIME ZONE 'America/Managua'
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_appointment_reminder_sent(
  p_appointment_id BIGINT,
  p_claim_token UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  WITH updated AS (
    UPDATE public.appointments
    SET
      reminder_sent_at = NOW(),
      reminder_claimed_at = NULL,
      reminder_claim_token = NULL
    WHERE id = p_appointment_id
      AND reminder_claim_token = p_claim_token
      AND reminder_sent_at IS NULL
    RETURNING id
  )
  SELECT EXISTS (SELECT 1 FROM updated);
$function$;

CREATE OR REPLACE FUNCTION public.release_appointment_reminder_claim(
  p_appointment_id BIGINT,
  p_claim_token UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  WITH updated AS (
    UPDATE public.appointments
    SET
      reminder_claimed_at = NULL,
      reminder_claim_token = NULL
    WHERE id = p_appointment_id
      AND reminder_claim_token = p_claim_token
      AND reminder_sent_at IS NULL
    RETURNING id
  )
  SELECT EXISTS (SELECT 1 FROM updated);
$function$;

REVOKE ALL ON FUNCTION public.claim_due_appointment_reminders(UUID, INTEGER)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_appointment_reminder_sent(BIGINT, UUID)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_appointment_reminder_claim(BIGINT, UUID)
  FROM PUBLIC;

DO $permissions$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'anon'
  ) THEN
    REVOKE ALL ON TABLE public.push_device_tokens FROM anon;
    REVOKE ALL ON SEQUENCE public.push_device_tokens_id_seq FROM anon;
    REVOKE ALL ON FUNCTION public.claim_due_appointment_reminders(UUID, INTEGER)
      FROM anon;
    REVOKE ALL ON FUNCTION public.mark_appointment_reminder_sent(BIGINT, UUID)
      FROM anon;
    REVOKE ALL ON FUNCTION public.release_appointment_reminder_claim(BIGINT, UUID)
      FROM anon;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'authenticated'
  ) THEN
    REVOKE ALL ON TABLE public.push_device_tokens FROM authenticated;
    REVOKE ALL ON SEQUENCE public.push_device_tokens_id_seq FROM authenticated;
    REVOKE ALL ON FUNCTION public.claim_due_appointment_reminders(UUID, INTEGER)
      FROM authenticated;
    REVOKE ALL ON FUNCTION public.mark_appointment_reminder_sent(BIGINT, UUID)
      FROM authenticated;
    REVOKE ALL ON FUNCTION public.release_appointment_reminder_claim(BIGINT, UUID)
      FROM authenticated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'service_role'
  ) THEN
    GRANT SELECT, INSERT, UPDATE, DELETE
      ON TABLE public.push_device_tokens TO service_role;
    GRANT USAGE, SELECT
      ON SEQUENCE public.push_device_tokens_id_seq TO service_role;
    GRANT EXECUTE
      ON FUNCTION public.claim_due_appointment_reminders(UUID, INTEGER)
      TO service_role;
    GRANT EXECUTE
      ON FUNCTION public.mark_appointment_reminder_sent(BIGINT, UUID)
      TO service_role;
    GRANT EXECUTE
      ON FUNCTION public.release_appointment_reminder_claim(BIGINT, UUID)
      TO service_role;
  END IF;
END;
$permissions$;

COMMIT;
