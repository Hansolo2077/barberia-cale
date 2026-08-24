const test = require("node:test");
const assert = require("node:assert/strict");

const db = require("../database/db");
const {
  registerDevice,
  deactivateDevice,
} = require("./notification.service");

test("device registration transfers token ownership and reactivates it", async () => {
  const originalQuery = db.query;
  const queries = [];

  db.query = async (sql, params) => {
    queries.push({ sql, params });
    return {
      rows: [
        {
          id: 4,
          userId: 7,
          expoPushToken: "ExpoPushToken[token123]",
          platform: "android",
          active: true,
        },
      ],
    };
  };

  try {
    const device = await registerDevice({
      userId: 7,
      expoPushToken: "ExpoPushToken[token123]",
      platform: "android",
    });

    assert.equal(device.active, true);
    assert.deepEqual(queries[0].params, [
      7,
      "ExpoPushToken[token123]",
      "android",
    ]);
    assert.match(
      queries[0].sql,
      /ON CONFLICT \(expo_push_token\)[\s\S]*user_id = EXCLUDED\.user_id[\s\S]*active = TRUE/
    );
  } finally {
    db.query = originalQuery;
  }
});

test("device deactivation is scoped to the authenticated owner", async () => {
  const originalQuery = db.query;
  const queries = [];

  db.query = async (sql, params) => {
    queries.push({ sql, params });
    return { rows: [] };
  };

  try {
    const device = await deactivateDevice(
      7,
      "ExpoPushToken[token123]"
    );

    assert.equal(device, null);
    assert.deepEqual(queries[0].params, [
      7,
      "ExpoPushToken[token123]",
    ]);
    assert.match(
      queries[0].sql,
      /SET[\s\S]*active = FALSE[\s\S]*WHERE user_id = \$1[\s\S]*expo_push_token = \$2/
    );
  } finally {
    db.query = originalQuery;
  }
});
