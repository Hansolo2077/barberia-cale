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


ALTER TABLE push_device_tokens
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
