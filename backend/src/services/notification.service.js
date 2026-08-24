const db = require("../database/db");

async function registerDevice({
  userId,
  expoPushToken,
  platform,
}) {
  const result = await db.query(
    `
      INSERT INTO push_device_tokens (
        user_id,
        expo_push_token,
        platform,
        active,
        last_seen_at,
        updated_at
      )
      VALUES ($1, $2, $3, TRUE, NOW(), NOW())
      ON CONFLICT (expo_push_token)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        active = TRUE,
        last_seen_at = NOW(),
        updated_at = NOW()
      RETURNING
        id,
        user_id AS "userId",
        expo_push_token AS "expoPushToken",
        platform,
        active,
        last_seen_at AS "lastSeenAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [userId, expoPushToken, platform]
  );

  return result.rows[0];
}

async function deactivateDevice(
  userId,
  expoPushToken
) {
  const result = await db.query(
    `
      UPDATE push_device_tokens
      SET
        active = FALSE,
        updated_at = NOW()
      WHERE user_id = $1
        AND expo_push_token = $2
      RETURNING
        id,
        user_id AS "userId",
        expo_push_token AS "expoPushToken",
        platform,
        active,
        last_seen_at AS "lastSeenAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [userId, expoPushToken]
  );

  return result.rows[0] ?? null;
}

module.exports = {
  registerDevice,
  deactivateDevice,
};
