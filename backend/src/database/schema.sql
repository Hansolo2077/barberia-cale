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

  created_at TIMESTAMPTZ
    NOT NULL
    DEFAULT NOW(),

  CONSTRAINT fk_appointments_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT
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