BEGIN;

-- Keep claims short enough to retry failures, but long enough that one worker
-- can process the deliberately small batch without another worker reclaiming it.
CREATE OR REPLACE FUNCTION public.claim_due_appointment_reminders(
  p_claim_token UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  appointment_id BIGINT,
  client_user_id BIGINT,
  appointment_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
DECLARE
  claim_time TIMESTAMPTZ := pg_catalog.clock_timestamp();
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
        OR appointment.reminder_claimed_at
          < claim_time - INTERVAL '15 minutes'
      )
      AND (
        (appointment.appointment_date + appointment.appointment_time)
        AT TIME ZONE 'America/Managua'
      ) > claim_time
      AND (
        (appointment.appointment_date + appointment.appointment_time)
        AT TIME ZONE 'America/Managua'
      ) - INTERVAL '1 hour' <= claim_time
    ORDER BY appointment.appointment_date, appointment.appointment_time
    FOR UPDATE OF appointment SKIP LOCKED
    LIMIT LEAST(
      GREATEST(COALESCE(p_limit, 5), 1),
      5
    )
  )
  UPDATE public.appointments AS appointment
  SET
    reminder_claimed_at = claim_time,
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

-- This is both an eligibility check and a lease heartbeat. It must succeed
-- immediately before a worker reads device tokens or dispatches a reminder.
CREATE OR REPLACE FUNCTION public.revalidate_appointment_reminder_claim(
  p_appointment_id BIGINT,
  p_claim_token UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  WITH updated AS (
    UPDATE public.appointments AS appointment
    SET reminder_claimed_at = pg_catalog.clock_timestamp()
    WHERE appointment.id = p_appointment_id
      AND appointment.reminder_claim_token = p_claim_token
      AND appointment.reminder_claimed_at IS NOT NULL
      AND appointment.reminder_sent_at IS NULL
      AND appointment.status = 'ACCEPTED'
      AND appointment.client_attendance_confirmed_at IS NULL
      AND (
        (appointment.appointment_date + appointment.appointment_time)
        AT TIME ZONE 'America/Managua'
      ) > pg_catalog.clock_timestamp()
    RETURNING appointment.id
  )
  SELECT EXISTS (SELECT 1 FROM updated);
$function$;

CREATE OR REPLACE FUNCTION public.mark_appointment_reminder_sent(
  p_appointment_id BIGINT,
  p_claim_token UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  WITH updated AS (
    UPDATE public.appointments AS appointment
    SET
      reminder_sent_at = pg_catalog.clock_timestamp(),
      reminder_claimed_at = NULL,
      reminder_claim_token = NULL
    WHERE appointment.id = p_appointment_id
      AND appointment.reminder_claim_token = p_claim_token
      AND appointment.reminder_claimed_at IS NOT NULL
      AND appointment.reminder_sent_at IS NULL
      AND appointment.status = 'ACCEPTED'
      AND appointment.client_attendance_confirmed_at IS NULL
      AND (
        (appointment.appointment_date + appointment.appointment_time)
        AT TIME ZONE 'America/Managua'
      ) > pg_catalog.clock_timestamp()
    RETURNING appointment.id
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
SET search_path = pg_catalog, pg_temp
AS $function$
  WITH updated AS (
    UPDATE public.appointments AS appointment
    SET
      reminder_claimed_at = NULL,
      reminder_claim_token = NULL
    WHERE appointment.id = p_appointment_id
      AND appointment.reminder_claim_token = p_claim_token
      AND appointment.reminder_sent_at IS NULL
    RETURNING appointment.id
  )
  SELECT EXISTS (SELECT 1 FROM updated);
$function$;

-- Any write path, including a direct administrative SQL update, invalidates an
-- active claim when the appointment can no longer receive a reminder.
CREATE OR REPLACE FUNCTION public.clear_ineligible_appointment_reminder_claim()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $function$
BEGIN
  IF NEW.reminder_claim_token IS NOT NULL
    AND (
      NEW.status <> 'ACCEPTED'
      OR NEW.client_attendance_confirmed_at IS NOT NULL
      OR NEW.reminder_sent_at IS NOT NULL
      OR (
        (NEW.appointment_date + NEW.appointment_time)
        AT TIME ZONE 'America/Managua'
      ) <= pg_catalog.clock_timestamp()
    )
  THEN
    NEW.reminder_claimed_at := NULL;
    NEW.reminder_claim_token := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS appointments_clear_ineligible_reminder_claim
  ON public.appointments;

CREATE TRIGGER appointments_clear_ineligible_reminder_claim
BEFORE UPDATE OF
  status,
  client_attendance_confirmed_at,
  reminder_sent_at,
  appointment_date,
  appointment_time
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.clear_ineligible_appointment_reminder_claim();

UPDATE public.appointments AS appointment
SET
  reminder_claimed_at = NULL,
  reminder_claim_token = NULL
WHERE appointment.reminder_claim_token IS NOT NULL
  AND (
    appointment.status <> 'ACCEPTED'
    OR appointment.client_attendance_confirmed_at IS NOT NULL
    OR appointment.reminder_sent_at IS NOT NULL
    OR (
      (appointment.appointment_date + appointment.appointment_time)
      AT TIME ZONE 'America/Managua'
    ) <= pg_catalog.clock_timestamp()
  );

DO $constraints$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.appointments'::REGCLASS
      AND conname = 'appointments_reminder_claim_eligible_state'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_reminder_claim_eligible_state
      CHECK (
        reminder_claim_token IS NULL
        OR (
          status = 'ACCEPTED'
          AND client_attendance_confirmed_at IS NULL
          AND reminder_sent_at IS NULL
        )
      );
  END IF;
END;
$constraints$;

CREATE OR REPLACE FUNCTION reminder_api.claim_due_appointment_reminders(
  p_claim_token UUID,
  p_limit INTEGER DEFAULT 5
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

CREATE OR REPLACE FUNCTION reminder_api.revalidate_appointment_reminder_claim(
  p_appointment_id BIGINT,
  p_claim_token UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  SELECT public.revalidate_appointment_reminder_claim(
    p_appointment_id,
    p_claim_token
  );
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
    AND appointment.status = 'ACCEPTED'
    AND appointment.client_attendance_confirmed_at IS NULL
    AND (
      (appointment.appointment_date + appointment.appointment_time)
      AT TIME ZONE 'America/Managua'
    ) > pg_catalog.clock_timestamp()
    AND device.active = TRUE
  ORDER BY device.last_seen_at DESC, device.id DESC
  LIMIT 100;
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
  public.claim_due_appointment_reminders(UUID, INTEGER),
  public.revalidate_appointment_reminder_claim(BIGINT, UUID),
  public.mark_appointment_reminder_sent(BIGINT, UUID),
  public.release_appointment_reminder_claim(BIGINT, UUID),
  public.clear_ineligible_appointment_reminder_claim()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
  reminder_api.claim_due_appointment_reminders(UUID, INTEGER),
  reminder_api.revalidate_appointment_reminder_claim(BIGINT, UUID),
  reminder_api.get_claimed_appointment_device_tokens(BIGINT, UUID),
  reminder_api.mark_appointment_reminder_sent(BIGINT, UUID),
  reminder_api.release_appointment_reminder_claim(BIGINT, UUID)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.claim_due_appointment_reminders(UUID, INTEGER),
  public.revalidate_appointment_reminder_claim(BIGINT, UUID),
  public.mark_appointment_reminder_sent(BIGINT, UUID),
  public.release_appointment_reminder_claim(BIGINT, UUID)
  TO service_role;

GRANT EXECUTE ON FUNCTION
  reminder_api.claim_due_appointment_reminders(UUID, INTEGER),
  reminder_api.revalidate_appointment_reminder_claim(BIGINT, UUID),
  reminder_api.get_claimed_appointment_device_tokens(BIGINT, UUID),
  reminder_api.mark_appointment_reminder_sent(BIGINT, UUID),
  reminder_api.release_appointment_reminder_claim(BIGINT, UUID)
  TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
