const test = require("node:test");
const assert = require("node:assert/strict");

const db = require("../database/db");

const {
  MANUAL_REMINDER_COOLDOWN_MINUTES,
  MAX_BULK_REMINDERS,
  getAttendanceReminderSummary,
  queueAttendanceReminders,
  queueAppointmentAttendanceReminder,
} = require("./admin-reminder.service");

test("manual reminder summary uses the server eligibility contract", async () => {
  const originalQuery = db.query;
  const queries = [];

  db.query = async (sql, params) => {
    queries.push({ sql, params });

    return {
      rows: [
        {
          matched: 8,
          eligible: 3,
          queued: 0,
          alreadyQueued: 2,
          cooldown: 1,
          withoutDevice: 2,
          concurrentSkipped: 0,
          remainingEligible: 0,
        },
      ],
    };
  };

  try {
    const summary =
      await getAttendanceReminderSummary();

    assert.deepEqual(summary, {
      matched: 8,
      eligible: 3,
      queued: 0,
      alreadyQueued: 2,
      cooldown: 1,
      withoutDevice: 2,
      concurrentSkipped: 0,
      remainingEligible: 0,
    });

    assert.equal(queries.length, 1);
    assert.match(
      queries[0].sql,
      /appointment\.status = 'ACCEPTED'/
    );
    assert.match(
      queries[0].sql,
      /client_attendance_confirmed_at IS NULL/
    );
    assert.match(
      queries[0].sql,
      /appointment_date[\s\S]*appointment_time[\s\S]*AT TIME ZONE 'America\/Managua'/
    );
    assert.match(
      queries[0].sql,
      /push_device_tokens[\s\S]*device\.active = TRUE/
    );
    assert.match(
      queries[0].sql,
      /job\.status IN \('QUEUED', 'CLAIMED'\)/
    );
    assert.match(
      queries[0].sql,
      /job\.status = 'SENT'[\s\S]*INTERVAL '15 minutes'/
    );
    assert.match(
      queries[0].sql,
      /COALESCE\([\s\S]*appointment\.reminder_sent_at[\s\S]*INTERVAL '15 minutes'[\s\S]*FALSE/
    );
    assert.doesNotMatch(
      queries[0].sql,
      /INTERVAL '1 hour'/
    );
  } finally {
    db.query = originalQuery;
  }
});

test("bulk queue inserts at most 100 independently auditable jobs", async () => {
  const originalQuery = db.query;
  const queries = [];

  db.query = async (sql, params) => {
    queries.push({ sql, params });

    return {
      rows: [
        {
          matched: "130",
          eligible: "123",
          queued: "100",
          alreadyQueued: "2",
          cooldown: "1",
          withoutDevice: "4",
          concurrentSkipped: "0",
          remainingEligible: "23",
        },
      ],
    };
  };

  try {
    const summary =
      await queueAttendanceReminders(9);

    assert.equal(
      MAX_BULK_REMINDERS,
      100
    );
    assert.equal(
      MANUAL_REMINDER_COOLDOWN_MINUTES,
      15
    );
    assert.deepEqual(
      queries[0].params,
      [9]
    );
    assert.deepEqual(summary, {
      matched: 130,
      eligible: 123,
      queued: 100,
      alreadyQueued: 2,
      cooldown: 1,
      withoutDevice: 4,
      concurrentSkipped: 0,
      remainingEligible: 23,
    });
    assert.match(
      queries[0].sql,
      /INSERT INTO appointment_notification_jobs/
    );
    assert.match(
      queries[0].sql,
      /'ATTENDANCE_REMINDER'[\s\S]*'ADMIN_MANUAL'[\s\S]*\$1[\s\S]*'QUEUED'/
    );
    assert.match(
      queries[0].sql,
      /LIMIT 100/
    );
    assert.match(
      queries[0].sql,
      /ON CONFLICT DO NOTHING/
    );
    assert.match(
      queries[0].sql,
      /selected[\s\S]*inserted[\s\S]*"concurrentSkipped"/
    );
    assert.doesNotMatch(
      queries[0].sql,
      /INTERVAL '1 hour'/
    );
  } finally {
    db.query = originalQuery;
  }
});

test("individual queue records the authenticated administrator", async () => {
  const originalQuery = db.query;
  const queries = [];

  db.query = async (sql, params) => {
    queries.push({ sql, params });

    return {
      rows: [
        {
          appointmentId: 17,
          appointmentStatus: "ACCEPTED",
          clientAttendanceConfirmedAt: null,
          isFuture: true,
          hasActiveDevice: true,
          hasActiveJob: false,
          inCooldown: false,
          jobId: 44,
          kind: "ATTENDANCE_REMINDER",
          source: "ADMIN_MANUAL",
          requestedByUserId: 9,
          jobStatus: "QUEUED",
          requestedAt:
            "2026-08-24T15:00:00.000Z",
          availableAt:
            "2026-08-24T15:00:00.000Z",
          sentAt: null,
          acceptedDevices: 0,
          attempts: 0,
        },
      ],
    };
  };

  try {
    const reminder =
      await queueAppointmentAttendanceReminder(
        17,
        9
      );

    assert.deepEqual(
      queries[0].params,
      [17, 9]
    );
    assert.equal(reminder.id, 44);
    assert.equal(
      reminder.appointmentId,
      17
    );
    assert.equal(
      reminder.requestedByUserId,
      9
    );
    assert.equal(
      reminder.status,
      "QUEUED"
    );
    assert.match(
      queries[0].sql,
      /WHERE appointment\.id = \$1/
    );
    assert.match(
      queries[0].sql,
      /requested_by_user_id[\s\S]*\$2/
    );
    assert.match(
      queries[0].sql,
      /candidate\.status = 'ACCEPTED'/
    );
    assert.match(
      queries[0].sql,
      /candidate\.client_attendance_confirmed_at IS NULL/
    );
    assert.doesNotMatch(
      queries[0].sql,
      /INTERVAL '1 hour'/
    );
  } finally {
    db.query = originalQuery;
  }
});

test("individual queue reports each ineligible state explicitly", async () => {
  const originalQuery = db.query;

  const cases = [
    {
      row: {},
      statusCode: 404,
      code: "APPOINTMENT_NOT_FOUND",
    },
    {
      row: {
        appointmentId: 17,
        appointmentStatus: "PENDING",
      },
      statusCode: 409,
      code: "APPOINTMENT_NOT_ACCEPTED",
    },
    {
      row: {
        appointmentId: 17,
        appointmentStatus: "ACCEPTED",
        clientAttendanceConfirmedAt:
          "2026-08-24T14:00:00.000Z",
        isFuture: true,
      },
      statusCode: 409,
      code: "ATTENDANCE_ALREADY_CONFIRMED",
    },
    {
      row: {
        appointmentId: 17,
        appointmentStatus: "ACCEPTED",
        clientAttendanceConfirmedAt: null,
        isFuture: false,
      },
      statusCode: 409,
      code: "APPOINTMENT_ALREADY_STARTED",
    },
    {
      row: {
        appointmentId: 17,
        appointmentStatus: "ACCEPTED",
        clientAttendanceConfirmedAt: null,
        isFuture: true,
        hasActiveJob: true,
      },
      statusCode: 409,
      code: "REMINDER_ALREADY_QUEUED",
    },
    {
      row: {
        appointmentId: 17,
        appointmentStatus: "ACCEPTED",
        clientAttendanceConfirmedAt: null,
        isFuture: true,
        hasActiveJob: false,
        inCooldown: true,
      },
      statusCode: 409,
      code: "REMINDER_COOLDOWN",
    },
    {
      row: {
        appointmentId: 17,
        appointmentStatus: "ACCEPTED",
        clientAttendanceConfirmedAt: null,
        isFuture: true,
        hasActiveJob: false,
        inCooldown: false,
        hasActiveDevice: false,
      },
      statusCode: 422,
      code: "CLIENT_WITHOUT_PUSH_DEVICE",
    },
    {
      row: {
        appointmentId: 17,
        appointmentStatus: "ACCEPTED",
        clientAttendanceConfirmedAt: null,
        isFuture: true,
        hasActiveJob: false,
        inCooldown: false,
        hasActiveDevice: true,
        jobId: null,
      },
      statusCode: 409,
      code: "REMINDER_CONCURRENTLY_QUEUED",
    },
  ];

  try {
    for (const testCase of cases) {
      db.query = async () => ({
        rows: [testCase.row],
      });

      await assert.rejects(
        queueAppointmentAttendanceReminder(
          17,
          9
        ),
        (error) => {
          assert.equal(
            error.statusCode,
            testCase.statusCode
          );
          assert.equal(
            error.code,
            testCase.code
          );
          return true;
        }
      );
    }
  } finally {
    db.query = originalQuery;
  }
});
