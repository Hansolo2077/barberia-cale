-- Prerequisites:
--   * pg_cron and pg_net enabled
--   * Vault secret named appointment_reminder_cron_secret
-- Re-running this statement updates the existing job with the same name.
SELECT cron.schedule(
  'send-appointment-reminders',
  '* * * * *',
  $job$
    SELECT net.http_post(
      url := 'https://fjwvwaoliehwigugsnva.supabase.co/functions/v1/bright-endpoint',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'appointment_reminder_cron_secret'
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    ) AS request_id;
  $job$
);
