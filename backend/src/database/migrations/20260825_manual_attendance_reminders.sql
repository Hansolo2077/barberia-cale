BEGIN;

CREATE TABLE IF NOT EXISTS public.appointment_notification_jobs (
  id BIGSERIAL PRIMARY KEY,
  appointment_id BIGINT NOT NULL,
  kind VARCHAR(40) NOT NULL DEFAULT 'ATTENDANCE_REMINDER'
    CHECK (kind IN ('ATTENDANCE_REMINDER')),
  source VARCHAR(40) NOT NULL DEFAULT 'ADMIN_MANUAL'
    CHECK (source IN ('ADMIN_MANUAL')),
  requested_by_user_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN ('QUEUED', 'CLAIMED', 'SENT', 'SKIPPED', 'FAILED')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.clock_timestamp(),
  available_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.clock_timestamp(),
  claimed_at TIMESTAMPTZ,
  claim_token UUID,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  accepted_devices INTEGER NOT NULL DEFAULT 0
    CHECK (accepted_devices >= 0),
  attempts INTEGER NOT NULL DEFAULT 0
    CHECK (attempts >= 0),
  failure_code VARCHAR(80),
  last_error TEXT,
  CONSTRAINT fk_appointment_notification_jobs_appointment
    FOREIGN KEY (appointment_id)
    REFERENCES public.appointments(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_appointment_notification_jobs_requester
    FOREIGN KEY (requested_by_user_id)
    REFERENCES public.users(id)
    ON DELETE RESTRICT,
  CONSTRAINT appointment_notification_jobs_claim_consistent
    CHECK (
      (
        status = 'CLAIMED'
        AND claimed_at IS NOT NULL
        AND claim_token IS NOT NULL
      )
      OR (
        status <> 'CLAIMED'
        AND claimed_at IS NULL
        AND claim_token IS NULL
      )
    ),
  CONSTRAINT appointment_notification_jobs_completion_consistent
    CHECK (
      (status IN ('SENT', 'SKIPPED', 'FAILED')) =
      (completed_at IS NOT NULL)
    ),
  CONSTRAINT appointment_notification_jobs_sent_consistent
    CHECK (
      (status = 'SENT') =
      (sent_at IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS
  idx_appointment_notification_jobs_active
ON public.appointment_notification_jobs (
  appointment_id,
  kind
)
WHERE status IN ('QUEUED', 'CLAIMED');

CREATE INDEX IF NOT EXISTS
  idx_appointment_notification_jobs_queue
ON public.appointment_notification_jobs (
  available_at,
  requested_at,
  id
)
WHERE status IN ('QUEUED', 'CLAIMED');

CREATE INDEX IF NOT EXISTS
  idx_appointment_notification_jobs_sent
ON public.appointment_notification_jobs (
  appointment_id,
  sent_at DESC
)
WHERE status = 'SENT';

ALTER TABLE public.appointment_notification_jobs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.appointment_notification_jobs
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.appointment_notification_jobs_id_seq
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.skip_ineligible_appointment_notification_jobs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
DECLARE
  skip_code TEXT;
BEGIN
  IF NEW.status <> 'ACCEPTED' THEN
    skip_code := 'APPOINTMENT_NOT_ACCEPTED';
  ELSIF NEW.client_attendance_confirmed_at IS NOT NULL THEN
    skip_code := 'ATTENDANCE_ALREADY_CONFIRMED';
  ELSIF (
    (NEW.appointment_date + NEW.appointment_time)
    AT TIME ZONE 'America/Managua'
  ) <= pg_catalog.clock_timestamp() THEN
    skip_code := 'APPOINTMENT_ALREADY_STARTED';
  END IF;

  IF skip_code IS NOT NULL THEN
    UPDATE public.appointment_notification_jobs AS job
    SET
      status = 'SKIPPED',
      claimed_at = NULL,
      claim_token = NULL,
      completed_at = pg_catalog.clock_timestamp(),
      failure_code = skip_code,
      last_error = NULL
    WHERE job.appointment_id = NEW.id
      AND job.kind = 'ATTENDANCE_REMINDER'
      AND job.status IN ('QUEUED', 'CLAIMED');
  ELSIF NEW.reminder_sent_at IS NOT NULL
    AND OLD.reminder_sent_at IS DISTINCT FROM NEW.reminder_sent_at
  THEN
    UPDATE public.appointment_notification_jobs AS job
    SET
      status = 'SKIPPED',
      claimed_at = NULL,
      claim_token = NULL,
      completed_at = pg_catalog.clock_timestamp(),
      failure_code = 'RECENT_AUTOMATIC_REMINDER',
      last_error = NULL
    WHERE job.appointment_id = NEW.id
      AND job.kind = 'ATTENDANCE_REMINDER'
      AND job.status IN ('QUEUED', 'CLAIMED')
      AND NEW.reminder_sent_at >
        job.requested_at - INTERVAL '15 minutes';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS appointments_skip_ineligible_notification_jobs
  ON public.appointments;

CREATE TRIGGER appointments_skip_ineligible_notification_jobs
AFTER UPDATE OF
  status,
  client_attendance_confirmed_at,
  appointment_date,
  appointment_time,
  reminder_sent_at
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.skip_ineligible_appointment_notification_jobs();

CREATE OR REPLACE FUNCTION public.claim_manual_appointment_reminders(
  p_claim_token UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  job_id BIGINT,
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

  UPDATE public.appointment_notification_jobs AS job
  SET
    status = 'SKIPPED',
    claimed_at = NULL,
    claim_token = NULL,
    completed_at = claim_time,
    failure_code = CASE
      WHEN appointment.status <> 'ACCEPTED'
        THEN 'APPOINTMENT_NOT_ACCEPTED'
      WHEN appointment.client_attendance_confirmed_at IS NOT NULL
        THEN 'ATTENDANCE_ALREADY_CONFIRMED'
      WHEN (
        (appointment.appointment_date + appointment.appointment_time)
        AT TIME ZONE 'America/Managua'
      ) <= claim_time
        THEN 'APPOINTMENT_ALREADY_STARTED'
      ELSE 'RECENT_AUTOMATIC_REMINDER'
    END,
    last_error = NULL
  FROM public.appointments AS appointment
  WHERE appointment.id = job.appointment_id
    AND job.kind = 'ATTENDANCE_REMINDER'
    AND job.source = 'ADMIN_MANUAL'
    AND job.status IN ('QUEUED', 'CLAIMED')
    AND (
      appointment.status <> 'ACCEPTED'
      OR appointment.client_attendance_confirmed_at IS NOT NULL
      OR (
        (appointment.appointment_date + appointment.appointment_time)
        AT TIME ZONE 'America/Managua'
      ) <= claim_time
      OR (
        appointment.reminder_sent_at IS NOT NULL
        AND appointment.reminder_sent_at >
          job.requested_at - INTERVAL '15 minutes'
      )
    );

  -- A worker may disappear after taking its third and final lease. Make that
  -- terminal so the partial unique index cannot block future manual sends
  -- forever.
  UPDATE public.appointment_notification_jobs AS job
  SET
    status = 'FAILED',
    claimed_at = NULL,
    claim_token = NULL,
    completed_at = claim_time,
    failure_code = COALESCE(job.failure_code, 'DELIVERY_RETRIES_EXHAUSTED'),
    last_error = COALESCE(
      job.last_error,
      'El worker no completó el último intento antes de vencer el reclamo.'
    )
  WHERE job.kind = 'ATTENDANCE_REMINDER'
    AND job.source = 'ADMIN_MANUAL'
    AND job.attempts >= 3
    AND (
      job.status = 'QUEUED'
      OR (
        job.status = 'CLAIMED'
        AND job.claimed_at < claim_time - INTERVAL '15 minutes'
      )
    );

  RETURN QUERY
  WITH candidates AS MATERIALIZED (
    SELECT job.id
    FROM public.appointment_notification_jobs AS job
    INNER JOIN public.appointments AS appointment
      ON appointment.id = job.appointment_id
    WHERE job.kind = 'ATTENDANCE_REMINDER'
      AND job.source = 'ADMIN_MANUAL'
      AND job.available_at <= claim_time
      AND job.attempts < 3
      AND (
        job.status = 'QUEUED'
        OR (
          job.status = 'CLAIMED'
          AND job.claimed_at < claim_time - INTERVAL '15 minutes'
        )
      )
      AND appointment.status = 'ACCEPTED'
      AND appointment.client_attendance_confirmed_at IS NULL
      AND (
        (appointment.appointment_date + appointment.appointment_time)
        AT TIME ZONE 'America/Managua'
      ) > claim_time
      AND (
        appointment.reminder_claim_token IS NULL
        OR appointment.reminder_claimed_at
          < claim_time - INTERVAL '15 minutes'
      )
      AND (
        appointment.reminder_sent_at IS NULL
        OR appointment.reminder_sent_at <=
          job.requested_at - INTERVAL '15 minutes'
      )
    ORDER BY job.available_at, job.requested_at, job.id
    FOR UPDATE OF job, appointment SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 5), 1), 5)
  )
  UPDATE public.appointment_notification_jobs AS job
  SET
    status = 'CLAIMED',
    claimed_at = claim_time,
    claim_token = p_claim_token,
    attempts = job.attempts + 1,
    failure_code = NULL,
    last_error = NULL,
    completed_at = NULL,
    sent_at = NULL,
    accepted_devices = 0
  FROM candidates, public.appointments AS appointment
  WHERE job.id = candidates.id
    AND appointment.id = job.appointment_id
  RETURNING
    job.id,
    job.appointment_id,
    appointment.user_id,
    (
      (appointment.appointment_date + appointment.appointment_time)
      AT TIME ZONE 'America/Managua'
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.revalidate_manual_appointment_reminder_claim(
  p_job_id BIGINT,
  p_claim_token UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  WITH updated AS (
    UPDATE public.appointment_notification_jobs AS job
    SET claimed_at = pg_catalog.clock_timestamp()
    FROM public.appointments AS appointment
    WHERE job.id = p_job_id
      AND job.appointment_id = appointment.id
      AND job.kind = 'ATTENDANCE_REMINDER'
      AND job.source = 'ADMIN_MANUAL'
      AND job.status = 'CLAIMED'
      AND job.claim_token = p_claim_token
      AND appointment.status = 'ACCEPTED'
      AND appointment.client_attendance_confirmed_at IS NULL
      AND (
        (appointment.appointment_date + appointment.appointment_time)
        AT TIME ZONE 'America/Managua'
      ) > pg_catalog.clock_timestamp()
      AND (
        appointment.reminder_claim_token IS NULL
        OR appointment.reminder_claimed_at
          < pg_catalog.clock_timestamp() - INTERVAL '15 minutes'
      )
      AND (
        appointment.reminder_sent_at IS NULL
        OR appointment.reminder_sent_at <=
          job.requested_at - INTERVAL '15 minutes'
      )
    RETURNING job.id
  )
  SELECT EXISTS (SELECT 1 FROM updated);
$function$;

CREATE OR REPLACE FUNCTION public.mark_manual_appointment_reminder_sent(
  p_job_id BIGINT,
  p_claim_token UUID,
  p_accepted_devices INTEGER
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  WITH updated AS (
    UPDATE public.appointment_notification_jobs AS job
    SET
      status = 'SENT',
      claimed_at = NULL,
      claim_token = NULL,
      sent_at = pg_catalog.clock_timestamp(),
      completed_at = pg_catalog.clock_timestamp(),
      accepted_devices = GREATEST(COALESCE(p_accepted_devices, 0), 0),
      failure_code = NULL,
      last_error = NULL
    FROM public.appointments AS appointment
    WHERE job.id = p_job_id
      AND job.appointment_id = appointment.id
      AND job.kind = 'ATTENDANCE_REMINDER'
      AND job.source = 'ADMIN_MANUAL'
      AND job.status = 'CLAIMED'
      AND job.claim_token = p_claim_token
      AND COALESCE(p_accepted_devices, 0) > 0
      AND appointment.status = 'ACCEPTED'
      AND appointment.client_attendance_confirmed_at IS NULL
      AND (
        (appointment.appointment_date + appointment.appointment_time)
        AT TIME ZONE 'America/Managua'
      ) > pg_catalog.clock_timestamp()
      AND (
        appointment.reminder_claim_token IS NULL
        OR appointment.reminder_claimed_at
          < pg_catalog.clock_timestamp() - INTERVAL '15 minutes'
      )
      AND (
        appointment.reminder_sent_at IS NULL
        OR appointment.reminder_sent_at <=
          job.requested_at - INTERVAL '15 minutes'
      )
    RETURNING job.id
  )
  SELECT EXISTS (SELECT 1 FROM updated);
$function$;

CREATE OR REPLACE FUNCTION public.mark_manual_appointment_reminder_skipped(
  p_job_id BIGINT,
  p_claim_token UUID,
  p_failure_code TEXT,
  p_accepted_devices INTEGER DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  WITH updated AS (
    UPDATE public.appointment_notification_jobs AS job
    SET
      status = 'SKIPPED',
      claimed_at = NULL,
      claim_token = NULL,
      completed_at = pg_catalog.clock_timestamp(),
      accepted_devices = GREATEST(COALESCE(p_accepted_devices, 0), 0),
      failure_code = LEFT(
        COALESCE(NULLIF(BTRIM(p_failure_code), ''), 'INELIGIBLE'),
        80
      ),
      last_error = NULL
    WHERE job.id = p_job_id
      AND job.kind = 'ATTENDANCE_REMINDER'
      AND job.source = 'ADMIN_MANUAL'
      AND job.status = 'CLAIMED'
      AND job.claim_token = p_claim_token
    RETURNING job.id
  )
  SELECT EXISTS (SELECT 1 FROM updated);
$function$;

CREATE OR REPLACE FUNCTION public.release_manual_appointment_reminder_claim(
  p_job_id BIGINT,
  p_claim_token UUID,
  p_failure_code TEXT,
  p_last_error TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  WITH updated AS (
    UPDATE public.appointment_notification_jobs AS job
    SET
      status = CASE WHEN job.attempts >= 3 THEN 'FAILED' ELSE 'QUEUED' END,
      available_at = CASE
        WHEN job.attempts >= 3 THEN job.available_at
        WHEN job.attempts = 1
          THEN pg_catalog.clock_timestamp() + INTERVAL '30 seconds'
        ELSE pg_catalog.clock_timestamp() + INTERVAL '2 minutes'
      END,
      claimed_at = NULL,
      claim_token = NULL,
      completed_at = CASE
        WHEN job.attempts >= 3 THEN pg_catalog.clock_timestamp()
        ELSE NULL
      END,
      failure_code = LEFT(
        COALESCE(NULLIF(BTRIM(p_failure_code), ''), 'DELIVERY_FAILED'),
        80
      ),
      last_error = CASE
        WHEN p_last_error IS NULL THEN NULL
        ELSE LEFT(p_last_error, 1000)
      END
    WHERE job.id = p_job_id
      AND job.kind = 'ATTENDANCE_REMINDER'
      AND job.source = 'ADMIN_MANUAL'
      AND job.status = 'CLAIMED'
      AND job.claim_token = p_claim_token
    RETURNING job.status
  )
  SELECT status FROM updated;
$function$;

CREATE OR REPLACE FUNCTION reminder_api.claim_manual_appointment_reminders(
  p_claim_token UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  job_id BIGINT,
  appointment_id BIGINT,
  client_user_id BIGINT,
  appointment_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  SELECT *
  FROM public.claim_manual_appointment_reminders(p_claim_token, p_limit);
$function$;

CREATE OR REPLACE FUNCTION reminder_api.revalidate_manual_appointment_reminder_claim(
  p_job_id BIGINT,
  p_claim_token UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  SELECT public.revalidate_manual_appointment_reminder_claim(
    p_job_id,
    p_claim_token
  );
$function$;

CREATE OR REPLACE FUNCTION reminder_api.get_manual_reminder_device_tokens(
  p_job_id BIGINT,
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
  FROM public.appointment_notification_jobs AS job
  INNER JOIN public.appointments AS appointment
    ON appointment.id = job.appointment_id
  INNER JOIN public.push_device_tokens AS device
    ON device.user_id = appointment.user_id
  WHERE job.id = p_job_id
    AND job.kind = 'ATTENDANCE_REMINDER'
    AND job.source = 'ADMIN_MANUAL'
    AND job.status = 'CLAIMED'
    AND job.claim_token = p_claim_token
    AND job.claimed_at IS NOT NULL
    AND appointment.status = 'ACCEPTED'
    AND appointment.client_attendance_confirmed_at IS NULL
    AND (
      (appointment.appointment_date + appointment.appointment_time)
      AT TIME ZONE 'America/Managua'
    ) > pg_catalog.clock_timestamp()
    AND (
      appointment.reminder_claim_token IS NULL
      OR appointment.reminder_claimed_at
        < pg_catalog.clock_timestamp() - INTERVAL '15 minutes'
    )
    AND (
      appointment.reminder_sent_at IS NULL
      OR appointment.reminder_sent_at <=
        job.requested_at - INTERVAL '15 minutes'
    )
    AND device.active = TRUE
  ORDER BY device.last_seen_at DESC, device.id DESC
  LIMIT 100;
$function$;

CREATE OR REPLACE FUNCTION reminder_api.deactivate_manual_reminder_device_token(
  p_job_id BIGINT,
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
      updated_at = pg_catalog.clock_timestamp()
    FROM public.appointment_notification_jobs AS job,
      public.appointments AS appointment
    WHERE job.id = p_job_id
      AND job.appointment_id = appointment.id
      AND job.kind = 'ATTENDANCE_REMINDER'
      AND job.source = 'ADMIN_MANUAL'
      AND job.status = 'CLAIMED'
      AND job.claim_token = p_claim_token
      AND job.claimed_at IS NOT NULL
      AND device.id = p_token_id
      AND device.user_id = appointment.user_id
    RETURNING device.id
  )
  SELECT EXISTS (SELECT 1 FROM updated);
$function$;

CREATE OR REPLACE FUNCTION reminder_api.mark_manual_appointment_reminder_sent(
  p_job_id BIGINT,
  p_claim_token UUID,
  p_accepted_devices INTEGER
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  SELECT public.mark_manual_appointment_reminder_sent(
    p_job_id,
    p_claim_token,
    p_accepted_devices
  );
$function$;

CREATE OR REPLACE FUNCTION reminder_api.mark_manual_appointment_reminder_skipped(
  p_job_id BIGINT,
  p_claim_token UUID,
  p_failure_code TEXT,
  p_accepted_devices INTEGER DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  SELECT public.mark_manual_appointment_reminder_skipped(
    p_job_id,
    p_claim_token,
    p_failure_code,
    p_accepted_devices
  );
$function$;

CREATE OR REPLACE FUNCTION reminder_api.release_manual_appointment_reminder_claim(
  p_job_id BIGINT,
  p_claim_token UUID,
  p_failure_code TEXT,
  p_last_error TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  SELECT public.release_manual_appointment_reminder_claim(
    p_job_id,
    p_claim_token,
    p_failure_code,
    p_last_error
  );
$function$;

-- A manual claim and an automatic claim never dispatch concurrently for the
-- same appointment. A successful manual send only delays the automatic worker
-- briefly; it does not set reminder_sent_at or consume the one-hour reminder.
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
      AND NOT EXISTS (
        SELECT 1
        FROM public.appointment_notification_jobs AS job
        WHERE job.appointment_id = appointment.id
          AND job.kind = 'ATTENDANCE_REMINDER'
          AND (
            (
              job.status = 'CLAIMED'
              AND job.claimed_at >= claim_time - INTERVAL '15 minutes'
            )
            OR (
              job.status = 'SENT'
              AND job.sent_at >= claim_time - INTERVAL '15 minutes'
            )
          )
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
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 5), 1), 5)
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
      AND NOT EXISTS (
        SELECT 1
        FROM public.appointment_notification_jobs AS job
        WHERE job.appointment_id = appointment.id
          AND job.kind = 'ATTENDANCE_REMINDER'
          AND (
            (
              job.status = 'CLAIMED'
              AND job.claimed_at >=
                pg_catalog.clock_timestamp() - INTERVAL '15 minutes'
            )
            OR (
              job.status = 'SENT'
              AND job.sent_at >=
                pg_catalog.clock_timestamp() - INTERVAL '15 minutes'
            )
          )
      )
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
      AND NOT EXISTS (
        SELECT 1
        FROM public.appointment_notification_jobs AS job
        WHERE job.appointment_id = appointment.id
          AND job.kind = 'ATTENDANCE_REMINDER'
          AND (
            (
              job.status = 'CLAIMED'
              AND job.claimed_at >=
                pg_catalog.clock_timestamp() - INTERVAL '15 minutes'
            )
            OR (
              job.status = 'SENT'
              AND job.sent_at >=
                pg_catalog.clock_timestamp() - INTERVAL '15 minutes'
            )
          )
      )
      AND (
        (appointment.appointment_date + appointment.appointment_time)
        AT TIME ZONE 'America/Managua'
      ) > pg_catalog.clock_timestamp()
    RETURNING appointment.id
  )
  SELECT EXISTS (SELECT 1 FROM updated);
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
    AND NOT EXISTS (
      SELECT 1
      FROM public.appointment_notification_jobs AS job
      WHERE job.appointment_id = appointment.id
        AND job.kind = 'ATTENDANCE_REMINDER'
        AND (
          (
            job.status = 'CLAIMED'
            AND job.claimed_at >=
              pg_catalog.clock_timestamp() - INTERVAL '15 minutes'
          )
          OR (
            job.status = 'SENT'
            AND job.sent_at >=
              pg_catalog.clock_timestamp() - INTERVAL '15 minutes'
          )
        )
    )
    AND (
      (appointment.appointment_date + appointment.appointment_time)
      AT TIME ZONE 'America/Managua'
    ) > pg_catalog.clock_timestamp()
    AND device.active = TRUE
  ORDER BY device.last_seen_at DESC, device.id DESC
  LIMIT 100;
$function$;

REVOKE ALL ON FUNCTION
  public.claim_manual_appointment_reminders(UUID, INTEGER),
  public.revalidate_manual_appointment_reminder_claim(BIGINT, UUID),
  public.mark_manual_appointment_reminder_sent(BIGINT, UUID, INTEGER),
  public.mark_manual_appointment_reminder_skipped(BIGINT, UUID, TEXT, INTEGER),
  public.release_manual_appointment_reminder_claim(BIGINT, UUID, TEXT, TEXT),
  public.skip_ineligible_appointment_notification_jobs()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
  reminder_api.claim_manual_appointment_reminders(UUID, INTEGER),
  reminder_api.revalidate_manual_appointment_reminder_claim(BIGINT, UUID),
  reminder_api.get_manual_reminder_device_tokens(BIGINT, UUID),
  reminder_api.deactivate_manual_reminder_device_token(BIGINT, UUID, BIGINT),
  reminder_api.mark_manual_appointment_reminder_sent(BIGINT, UUID, INTEGER),
  reminder_api.mark_manual_appointment_reminder_skipped(BIGINT, UUID, TEXT, INTEGER),
  reminder_api.release_manual_appointment_reminder_claim(BIGINT, UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
  public.claim_due_appointment_reminders(UUID, INTEGER),
  public.revalidate_appointment_reminder_claim(BIGINT, UUID),
  public.mark_appointment_reminder_sent(BIGINT, UUID),
  reminder_api.get_claimed_appointment_device_tokens(BIGINT, UUID)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.claim_manual_appointment_reminders(UUID, INTEGER),
  public.revalidate_manual_appointment_reminder_claim(BIGINT, UUID),
  public.mark_manual_appointment_reminder_sent(BIGINT, UUID, INTEGER),
  public.mark_manual_appointment_reminder_skipped(BIGINT, UUID, TEXT, INTEGER),
  public.release_manual_appointment_reminder_claim(BIGINT, UUID, TEXT, TEXT),
  public.claim_due_appointment_reminders(UUID, INTEGER),
  public.revalidate_appointment_reminder_claim(BIGINT, UUID),
  public.mark_appointment_reminder_sent(BIGINT, UUID)
  TO service_role;

GRANT EXECUTE ON FUNCTION
  reminder_api.claim_manual_appointment_reminders(UUID, INTEGER),
  reminder_api.revalidate_manual_appointment_reminder_claim(BIGINT, UUID),
  reminder_api.get_manual_reminder_device_tokens(BIGINT, UUID),
  reminder_api.deactivate_manual_reminder_device_token(BIGINT, UUID, BIGINT),
  reminder_api.mark_manual_appointment_reminder_sent(BIGINT, UUID, INTEGER),
  reminder_api.mark_manual_appointment_reminder_skipped(BIGINT, UUID, TEXT, INTEGER),
  reminder_api.release_manual_appointment_reminder_claim(BIGINT, UUID, TEXT, TEXT),
  reminder_api.get_claimed_appointment_device_tokens(BIGINT, UUID)
  TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
