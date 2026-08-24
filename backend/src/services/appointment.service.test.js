const test = require("node:test");
const assert = require("node:assert/strict");

const db = require("../database/db");

const {
  cancelAppointment,
  createAppointment,
  getAdminSearchCriteria,
} = require("./appointment.service");

test("admin search recognizes #ID without turning it into free text", () => {
  assert.deepEqual(
    getAdminSearchCriteria("#123"),
    {
      searchedId: "123",
      textSearch: "",
    }
  );
});

test("plain numeric admin search supports ID and phone text", () => {
  assert.deepEqual(
    getAdminSearchCriteria("123"),
    {
      searchedId: "123",
      textSearch: "123",
    }
  );
});

test("oversized IDs cannot overflow PostgreSQL bigint", () => {
  assert.deepEqual(
    getAdminSearchCriteria("#999999999999999999999999"),
    {
      searchedId: "-1",
      textSearch: "",
    }
  );
});

test("appointment creation locks the client and commits atomically", async () => {
  const originalConnect = db.connect;
  const commands = [];
  let released = false;

  const client = {
    async query(sql) {
      commands.push(sql);

      if (sql.includes("AS allowed")) {
        return { rows: [{ allowed: true }] };
      }

      if (sql.includes("candidate_windows")) {
        return {
          rows: [{ activeOnDate: 0, activeInSevenDays: 0 }],
        };
      }

      if (sql.includes("SELECT id")) {
        return { rows: [] };
      }

      if (sql.includes("INSERT INTO appointments")) {
        return {
          rows: [
            {
              id: 1,
              status: "PENDING",
            },
          ],
        };
      }

      return { rows: [] };
    },
    release() {
      released = true;
    },
  };

  db.connect = async () => client;

  try {
    const appointment = await createAppointment({
      userId: 7,
      service: "Corte de cabello",
      date: "2026-09-30",
      time: "08:00",
    });

    assert.equal(appointment.status, "PENDING");
    assert.ok(
      commands.some((sql) =>
        sql.includes("pg_advisory_xact_lock")
      )
    );
    assert.ok(commands.includes("COMMIT"));
    assert.equal(released, true);
  } finally {
    db.connect = originalConnect;
  }
});

test("client cancellation is atomic and allows the exact 60-minute boundary", async () => {
  const originalQuery = db.query;
  const queries = [];

  db.query = async (sql, params) => {
    queries.push({ sql, params });

    return {
      rows: [
        {
          id: 9,
          status: "CANCELLED",
        },
      ],
    };
  };

  try {
    const appointment = await cancelAppointment(7, 9);
    const cancellationQuery = queries[0];

    assert.equal(appointment.status, "CANCELLED");
    assert.deepEqual(cancellationQuery.params, [9, 7]);
    assert.match(
      cancellationQuery.sql,
      /UPDATE appointments[\s\S]*SET status = 'CANCELLED'[\s\S]*status IN \('PENDING', 'ACCEPTED'\)/
    );
    assert.match(
      cancellationQuery.sql,
      /appointment_date \+ appointment_time\) >= \([\s\S]*NOW\(\) AT TIME ZONE 'America\/Managua'[\s\S]*INTERVAL '60 minutes'/
    );
    assert.match(
      cancellationQuery.sql,
      /appointment_date \+ appointment_time\)[\s\S]*- INTERVAL '60 minutes'[\s\S]*AT TIME ZONE 'America\/Managua' AS "cancelUntil"/
    );
    assert.match(
      cancellationQuery.sql,
      /FALSE AS "canCancel"/
    );
    assert.doesNotMatch(
      cancellationQuery.sql,
      /created_at\s*>?=/
    );
  } finally {
    db.query = originalQuery;
  }
});

test("client cancellation reports the one-hour cutoff using the same appointment-time rule", async () => {
  const originalQuery = db.query;
  const queries = [];

  db.query = async (sql) => {
    queries.push(sql);

    if (queries.length === 1) {
      return { rows: [] };
    }

    return {
      rows: [
        {
          id: 9,
          status: "PENDING",
          canCancel: false,
        },
      ],
    };
  };

  try {
    await assert.rejects(
      cancelAppointment(7, 9),
      (error) => {
        assert.equal(error.statusCode, 400);
        assert.match(
          error.message,
          /al menos una hora antes/
        );
        return true;
      }
    );

    assert.match(
      queries[1],
      /appointment_date \+ appointment_time\) >= \([\s\S]*NOW\(\) AT TIME ZONE 'America\/Managua'[\s\S]*INTERVAL '60 minutes'/
    );
    assert.doesNotMatch(queries[1], /created_at\s*>?=/);
  } finally {
    db.query = originalQuery;
  }
});
