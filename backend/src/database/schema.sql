CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,

  first_name VARCHAR(100) NOT NULL,

  last_name VARCHAR(100) NOT NULL,

  phone VARCHAR(20) NOT NULL UNIQUE,

  password_hash TEXT NOT NULL,

  role VARCHAR(20) NOT NULL
    DEFAULT 'CLIENT'
    CHECK (
      role IN (
        'CLIENT',
        'ADMIN'
      )
    ),

  created_at TIMESTAMPTZ
    NOT NULL
    DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,

  user_id BIGINT NOT NULL,

  service VARCHAR(150) NOT NULL,

  appointment_date DATE NOT NULL,

  appointment_time TIME NOT NULL,

  status VARCHAR(20) NOT NULL
    DEFAULT 'PENDING'
    CHECK (
      status IN (
        'PENDING',
        'ACCEPTED',
        'COMPLETED',
        'REJECTED',
        'CANCELLED'
      )
    ),

  client_attendance_confirmed_at TIMESTAMPTZ,

  reminder_sent_at TIMESTAMPTZ,

  reminder_claimed_at TIMESTAMPTZ,

  reminder_claim_token UUID,

  reminder_attempts INTEGER
    NOT NULL
    DEFAULT 0,

  created_at TIMESTAMPTZ
    NOT NULL
    DEFAULT NOW(),

  CONSTRAINT fk_appointments_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT,

  CONSTRAINT appointments_reminder_claim_consistent
    CHECK (
      (reminder_claimed_at IS NULL) =
      (reminder_claim_token IS NULL)
    ),

  CONSTRAINT appointments_reminder_claim_eligible_state
    CHECK (
      reminder_claim_token IS NULL
      OR (
        status = 'ACCEPTED'
        AND client_attendance_confirmed_at IS NULL
        AND reminder_sent_at IS NULL
      )
    )
);


CREATE TABLE IF NOT EXISTS push_device_tokens (
  id BIGSERIAL PRIMARY KEY,

  user_id BIGINT NOT NULL,

  expo_push_token TEXT NOT NULL,

  platform VARCHAR(20) NOT NULL
    CHECK (
      platform IN (
        'android',
        'ios'
      )
    ),

  active BOOLEAN
    NOT NULL
    DEFAULT TRUE,

  last_seen_at TIMESTAMPTZ
    NOT NULL
    DEFAULT NOW(),

  created_at TIMESTAMPTZ
    NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL
    DEFAULT NOW(),

  CONSTRAINT fk_push_device_tokens_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT push_device_tokens_token_not_blank
    CHECK (
      LENGTH(BTRIM(expo_push_token)) > 0
    )
);


CREATE TABLE IF NOT EXISTS appointment_notification_jobs (
  id BIGSERIAL PRIMARY KEY,

  appointment_id BIGINT NOT NULL,

  kind VARCHAR(40) NOT NULL
    DEFAULT 'ATTENDANCE_REMINDER'
    CHECK (
      kind IN (
        'ATTENDANCE_REMINDER'
      )
    ),

  source VARCHAR(40) NOT NULL
    DEFAULT 'ADMIN_MANUAL'
    CHECK (
      source IN (
        'ADMIN_MANUAL'
      )
    ),

  requested_by_user_id BIGINT NOT NULL,

  status VARCHAR(20) NOT NULL
    DEFAULT 'QUEUED'
    CHECK (
      status IN (
        'QUEUED',
        'CLAIMED',
        'SENT',
        'SKIPPED',
        'FAILED'
      )
    ),

  requested_at TIMESTAMPTZ
    NOT NULL
    DEFAULT clock_timestamp(),

  available_at TIMESTAMPTZ
    NOT NULL
    DEFAULT clock_timestamp(),

  claimed_at TIMESTAMPTZ,

  claim_token UUID,

  sent_at TIMESTAMPTZ,

  completed_at TIMESTAMPTZ,

  accepted_devices INTEGER
    NOT NULL
    DEFAULT 0
    CHECK (accepted_devices >= 0),

  attempts INTEGER
    NOT NULL
    DEFAULT 0
    CHECK (attempts >= 0),

  failure_code VARCHAR(80),

  last_error TEXT,

  CONSTRAINT fk_appointment_notification_jobs_appointment
    FOREIGN KEY (appointment_id)
    REFERENCES appointments(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_appointment_notification_jobs_requester
    FOREIGN KEY (requested_by_user_id)
    REFERENCES users(id)
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
  idx_unique_active_appointment
ON appointments (
  appointment_date,
  appointment_time
)
WHERE status IN (
  'PENDING',
  'ACCEPTED'
);


CREATE INDEX IF NOT EXISTS
  idx_appointments_user_id
ON appointments (
  user_id
);


CREATE INDEX IF NOT EXISTS
  idx_appointments_date
ON appointments (
  appointment_date
);


CREATE INDEX IF NOT EXISTS
  idx_appointments_status
ON appointments (
  status
);


CREATE INDEX IF NOT EXISTS
  idx_appointments_user_schedule
ON appointments (
  user_id,
  appointment_date,
  appointment_time
);


CREATE INDEX IF NOT EXISTS
  idx_appointments_admin_schedule
ON appointments (
  appointment_date,
  appointment_time,
  status
);


CREATE UNIQUE INDEX IF NOT EXISTS
  idx_push_device_tokens_token
ON push_device_tokens (
  expo_push_token
);


CREATE INDEX IF NOT EXISTS
  idx_push_device_tokens_active_user
ON push_device_tokens (
  user_id
)
WHERE active = TRUE;


CREATE INDEX IF NOT EXISTS
  idx_appointments_due_reminders
ON appointments (
  appointment_date,
  appointment_time
)
WHERE status = 'ACCEPTED'
  AND client_attendance_confirmed_at IS NULL
  AND reminder_sent_at IS NULL;


CREATE UNIQUE INDEX IF NOT EXISTS
  idx_appointment_notification_jobs_active
ON appointment_notification_jobs (
  appointment_id,
  kind
)
WHERE status IN (
  'QUEUED',
  'CLAIMED'
);


CREATE INDEX IF NOT EXISTS
  idx_appointment_notification_jobs_queue
ON appointment_notification_jobs (
  available_at,
  requested_at,
  id
)
WHERE status IN (
  'QUEUED',
  'CLAIMED'
);


CREATE INDEX IF NOT EXISTS
  idx_appointment_notification_jobs_sent
ON appointment_notification_jobs (
  appointment_id,
  sent_at DESC
)
WHERE status = 'SENT';


ALTER TABLE push_device_tokens
  ENABLE ROW LEVEL SECURITY;


ALTER TABLE appointment_notification_jobs
  ENABLE ROW LEVEL SECURITY;


CREATE OR REPLACE FUNCTION
  public.clear_ineligible_appointment_reminder_claim()
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


DROP TRIGGER IF EXISTS
  appointments_clear_ineligible_reminder_claim
ON appointments;


CREATE TRIGGER
  appointments_clear_ineligible_reminder_claim
BEFORE UPDATE OF
  status,
  client_attendance_confirmed_at,
  reminder_sent_at,
  appointment_date,
  appointment_time
ON appointments
FOR EACH ROW
EXECUTE FUNCTION
  public.clear_ineligible_appointment_reminder_claim();


CREATE OR REPLACE FUNCTION
  public.skip_ineligible_appointment_notification_jobs()
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


DROP TRIGGER IF EXISTS
  appointments_skip_ineligible_notification_jobs
ON appointments;


CREATE TRIGGER
  appointments_skip_ineligible_notification_jobs
AFTER UPDATE OF
  status,
  client_attendance_confirmed_at,
  appointment_date,
  appointment_time,
  reminder_sent_at
ON appointments
FOR EACH ROW
EXECUTE FUNCTION
  public.skip_ineligible_appointment_notification_jobs();
