const test = require("node:test");
const assert = require("node:assert/strict");

const db = require("../database/db");

const {
  cancelAppointmentByAdmin,
  cancelAppointment,
  completeAppointment,
  confirmAppointmentAttendance,
  createAppointment,
  getAllAppointments,
  getAdminSearchCriteria,
  getAppointmentsByDateRange,
  getUserAppointments,
  rejectAppointment,
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
      /UPDATE appointments[\s\S]*SET[\s\S]*status = 'CANCELLED'[\s\S]*status IN \('PENDING', 'ACCEPTED'\)/
    );
    assert.match(
      cancellationQuery.sql,
      /status = 'CANCELLED',[\s\S]*reminder_claimed_at = NULL,[\s\S]*reminder_claim_token = NULL/
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

test("attendance confirmation is atomic, owned and keeps its first timestamp", async () => {
  const originalQuery = db.query;
  const queries = [];

  db.query = async (sql, params) => {
    queries.push({ sql, params });
    return {
      rows: [
        {
          id: 17,
          status: "ACCEPTED",
          clientAttendanceConfirmedAt: "2026-08-23T20:00:00.000Z",
          attendanceStatus: "CONFIRMED",
          canConfirmAttendance: false,
        },
      ],
    };
  };

  try {
    const appointment = await confirmAppointmentAttendance(7, 17);

    assert.equal(appointment.attendanceStatus, "CONFIRMED");
    assert.deepEqual(queries[0].params, [17, 7]);
    assert.match(
      queries[0].sql,
      /SET[\s\S]*client_attendance_confirmed_at = COALESCE\([\s\S]*client_attendance_confirmed_at,[\s\S]*NOW\(\)/
    );
    assert.match(
      queries[0].sql,
      /client_attendance_confirmed_at = COALESCE\([\s\S]*reminder_claimed_at = NULL,[\s\S]*reminder_claim_token = NULL/
    );
    assert.match(
      queries[0].sql,
      /WHERE id = \$1[\s\S]*user_id = \$2[\s\S]*status = 'ACCEPTED'/
    );
    assert.match(
      queries[0].sql,
      /appointment_date \+ appointment_time[\s\S]*NOW\(\) AT TIME ZONE 'America\/Managua'/
    );
  } finally {
    db.query = originalQuery;
  }
});

test("administrative terminal transitions clear active reminder claims", async () => {
  const originalQuery = db.query;

  const transitions = [
    {
      run: () => rejectAppointment(17),
      selected: { id: 17, status: "PENDING" },
      updated: { id: 17, status: "REJECTED" },
      status: "REJECTED",
    },
    {
      run: () => cancelAppointmentByAdmin(17),
      selected: { id: 17, status: "ACCEPTED", isFuture: true },
      updated: { id: 17, status: "CANCELLED" },
      status: "CANCELLED",
    },
    {
      run: () => completeAppointment(17),
      selected: { id: 17, status: "ACCEPTED", canComplete: true },
      updated: { id: 17, status: "COMPLETED" },
      status: "COMPLETED",
    },
  ];

  try {
    for (const transition of transitions) {
      const queries = [];

      db.query = async (sql) => {
        queries.push(sql);
        return queries.length === 1
          ? { rows: [transition.selected] }
          : { rows: [transition.updated] };
      };

      const appointment = await transition.run();

      assert.equal(appointment.status, transition.status);
      assert.match(
        queries[1],
        new RegExp(
          `status = '${transition.status}',[\\s\\S]*` +
            "reminder_claimed_at = NULL,[\\s\\S]*" +
            "reminder_claim_token = NULL"
        )
      );
    }
  } finally {
    db.query = originalQuery;
  }
});

test("attendance confirmation retries return an existing confirmation", async () => {
  const originalQuery = db.query;
  let queryCount = 0;

  db.query = async () => {
    queryCount += 1;

    if (queryCount === 1) {
      return { rows: [] };
    }

    return {
      rows: [
        {
          id: 17,
          status: "COMPLETED",
          clientAttendanceConfirmedAt: "2026-08-23T20:00:00.000Z",
          attendanceStatus: "CONFIRMED",
          canConfirmAttendance: false,
          isFuture: false,
        },
      ],
    };
  };

  try {
    const appointment = await confirmAppointmentAttendance(7, 17);

    assert.equal(queryCount, 2);
    assert.equal(appointment.attendanceStatus, "CONFIRMED");
    assert.equal("isFuture" in appointment, false);
  } finally {
    db.query = originalQuery;
  }
});

test("attendance confirmation hides appointments owned by another client", async () => {
  const originalQuery = db.query;

  db.query = async () => ({ rows: [] });

  try {
    await assert.rejects(
      confirmAppointmentAttendance(7, 99),
      (error) => {
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /no existe o no pertenece/);
        return true;
      }
    );
  } finally {
    db.query = originalQuery;
  }
});

test("attendance confirmation rejects invalid state and elapsed appointments", async () => {
  const originalQuery = db.query;

  try {
    for (const appointment of [
      {
        status: "PENDING",
        clientAttendanceConfirmedAt: null,
        isFuture: true,
      },
      {
        status: "ACCEPTED",
        clientAttendanceConfirmedAt: null,
        isFuture: false,
      },
      {
        status: "CANCELLED",
        clientAttendanceConfirmedAt: "2026-08-23T20:00:00.000Z",
        isFuture: true,
      },
    ]) {
      let queryCount = 0;

      db.query = async () => {
        queryCount += 1;
        return queryCount === 1
          ? { rows: [] }
          : { rows: [{ id: 17, ...appointment }] };
      };

      await assert.rejects(
        confirmAppointmentAttendance(7, 17),
        (error) => {
          assert.equal(error.statusCode, 409);
          return true;
        }
      );
    }
  } finally {
    db.query = originalQuery;
  }
});

test("client and admin listings expose the attendance contract", async () => {
  const originalQuery = db.query;
  const queries = [];

  db.query = async (sql) => {
    queries.push(sql);

    if (sql.includes("COUNT(*)::int AS total")) {
      return { rows: [{ total: 0 }] };
    }

    return { rows: [] };
  };

  try {
    await getUserAppointments(7, {
      page: 1,
      pageSize: 20,
      offset: 0,
    });

    assert.match(queries[0], /AS "clientAttendanceConfirmedAt"/);
    assert.match(queries[0], /AS "attendanceStatus"/);
    assert.match(queries[0], /AS "canConfirmAttendance"/);
    assert.doesNotMatch(queries[0], /AS "reminderSentAt"/);

    queries.length = 0;

    await getAllAppointments({
      page: 1,
      pageSize: 20,
      offset: 0,
    });

    assert.match(queries[0], /AS "clientAttendanceConfirmedAt"/);
    assert.match(queries[0], /AS "attendanceStatus"/);
    assert.match(queries[0], /AS "canConfirmAttendance"/);
    assert.match(queries[0], /AS "reminderSentAt"/);

    queries.length = 0;

    await getAppointmentsByDateRange(
      "2026-08-23",
      "2026-08-30",
      {
        page: 1,
        pageSize: 20,
        offset: 0,
      }
    );

    assert.match(queries[0], /AS "attendanceStatus"/);
    assert.match(queries[0], /AS "reminderSentAt"/);
  } finally {
    db.query = originalQuery;
  }
});
