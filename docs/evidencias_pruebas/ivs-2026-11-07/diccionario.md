# Diccionario de datos verificado

Generado desde PostgreSQL despues de ejecutar schema.sql y las cuatro migraciones. Solo estructura; sin registros de personas.

## users

| Campo | Tipo | Nulo | Valor por defecto |
| --- | --- | --- | --- |
| id | bigint | NO | nextval('users_id_seq'::regclass) |
| first_name | character varying(100) | NO |  |
| last_name | character varying(100) | NO |  |
| phone | character varying(20) | NO |  |
| password_hash | text | NO |  |
| role | character varying(20) | NO | 'CLIENT'::character varying |
| created_at | timestamp with time zone | NO | now() |

Restricciones:

- users_phone_key: UNIQUE (phone)
- users_pkey: PRIMARY KEY (id)
- users_role_check: CHECK (((role)::text = ANY ((ARRAY['CLIENT'::character varying, 'ADMIN'::character varying])::text[])))

## appointments

| Campo | Tipo | Nulo | Valor por defecto |
| --- | --- | --- | --- |
| id | bigint | NO | nextval('appointments_id_seq'::regclass) |
| user_id | bigint | NO |  |
| service | character varying(150) | NO |  |
| appointment_date | date | NO |  |
| appointment_time | time without time zone | NO |  |
| status | character varying(20) | NO | 'PENDING'::character varying |
| client_attendance_confirmed_at | timestamp with time zone | YES |  |
| reminder_sent_at | timestamp with time zone | YES |  |
| reminder_claimed_at | timestamp with time zone | YES |  |
| reminder_claim_token | uuid | YES |  |
| reminder_attempts | integer | NO | 0 |
| created_at | timestamp with time zone | NO | now() |

Restricciones:

- appointments_pkey: PRIMARY KEY (id)
- appointments_reminder_claim_consistent: CHECK (((reminder_claimed_at IS NULL) = (reminder_claim_token IS NULL)))
- appointments_reminder_claim_eligible_state: CHECK (((reminder_claim_token IS NULL) OR (((status)::text = 'ACCEPTED'::text) AND (client_attendance_confirmed_at IS NULL) AND (reminder_sent_at IS NULL))))
- appointments_status_check: CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'ACCEPTED'::character varying, 'COMPLETED'::character varying, 'REJECTED'::character varying, 'CANCELLED'::character varying])::text[])))
- fk_appointments_user: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT

## push_device_tokens

| Campo | Tipo | Nulo | Valor por defecto |
| --- | --- | --- | --- |
| id | bigint | NO | nextval('push_device_tokens_id_seq'::regclass) |
| user_id | bigint | NO |  |
| expo_push_token | text | NO |  |
| platform | character varying(20) | NO |  |
| active | boolean | NO | true |
| last_seen_at | timestamp with time zone | NO | now() |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

Restricciones:

- fk_push_device_tokens_user: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- push_device_tokens_pkey: PRIMARY KEY (id)
- push_device_tokens_platform_check: CHECK (((platform)::text = ANY ((ARRAY['android'::character varying, 'ios'::character varying])::text[])))
- push_device_tokens_token_not_blank: CHECK ((length(btrim(expo_push_token)) > 0))

## appointment_notification_jobs

| Campo | Tipo | Nulo | Valor por defecto |
| --- | --- | --- | --- |
| id | bigint | NO | nextval('appointment_notification_jobs_id_seq'::regclass) |
| appointment_id | bigint | NO |  |
| kind | character varying(40) | NO | 'ATTENDANCE_REMINDER'::character varying |
| source | character varying(40) | NO | 'ADMIN_MANUAL'::character varying |
| requested_by_user_id | bigint | NO |  |
| status | character varying(20) | NO | 'QUEUED'::character varying |
| requested_at | timestamp with time zone | NO | clock_timestamp() |
| available_at | timestamp with time zone | NO | clock_timestamp() |
| claimed_at | timestamp with time zone | YES |  |
| claim_token | uuid | YES |  |
| sent_at | timestamp with time zone | YES |  |
| completed_at | timestamp with time zone | YES |  |
| accepted_devices | integer | NO | 0 |
| attempts | integer | NO | 0 |
| failure_code | character varying(80) | YES |  |
| last_error | text | YES |  |

Restricciones:

- appointment_notification_jobs_accepted_devices_check: CHECK ((accepted_devices >= 0))
- appointment_notification_jobs_attempts_check: CHECK ((attempts >= 0))
- appointment_notification_jobs_claim_consistent: CHECK (((((status)::text = 'CLAIMED'::text) AND (claimed_at IS NOT NULL) AND (claim_token IS NOT NULL)) OR (((status)::text <> 'CLAIMED'::text) AND (claimed_at IS NULL) AND (claim_token IS NULL))))
- appointment_notification_jobs_completion_consistent: CHECK ((((status)::text = ANY ((ARRAY['SENT'::character varying, 'SKIPPED'::character varying, 'FAILED'::character varying])::text[])) = (completed_at IS NOT NULL)))
- appointment_notification_jobs_kind_check: CHECK (((kind)::text = 'ATTENDANCE_REMINDER'::text))
- appointment_notification_jobs_pkey: PRIMARY KEY (id)
- appointment_notification_jobs_sent_consistent: CHECK ((((status)::text = 'SENT'::text) = (sent_at IS NOT NULL)))
- appointment_notification_jobs_source_check: CHECK (((source)::text = 'ADMIN_MANUAL'::text))
- appointment_notification_jobs_status_check: CHECK (((status)::text = ANY ((ARRAY['QUEUED'::character varying, 'CLAIMED'::character varying, 'SENT'::character varying, 'SKIPPED'::character varying, 'FAILED'::character varying])::text[])))
- fk_appointment_notification_jobs_appointment: FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
- fk_appointment_notification_jobs_requester: FOREIGN KEY (requested_by_user_id) REFERENCES users(id) ON DELETE RESTRICT

