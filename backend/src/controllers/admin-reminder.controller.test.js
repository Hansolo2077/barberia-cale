const test = require("node:test");
const assert = require("node:assert/strict");

const adminReminderService = require(
  "../services/admin-reminder.service"
);

const {
  getAttendanceReminderSummary,
  queueAttendanceReminders,
  queueAppointmentAttendanceReminder,
} = require("./admin-reminder.controller");

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("summary controller exposes eligibility and policy", async () => {
  const originalGetSummary =
    adminReminderService
      .getAttendanceReminderSummary;

  adminReminderService
    .getAttendanceReminderSummary = async () => ({
      matched: 4,
      eligible: 2,
      queued: 0,
      alreadyQueued: 1,
      cooldown: 0,
      withoutDevice: 1,
      concurrentSkipped: 0,
      remainingEligible: 0,
    });

  try {
    const response = createResponse();

    await getAttendanceReminderSummary(
      {
        user: {
          userId: 9,
          role: "ADMIN",
        },
      },
      response
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.equal(
      response.body.summary.eligible,
      2
    );
    assert.deepEqual(response.body.policy, {
      cooldownMinutes: 15,
      bulkLimit: 100,
    });
  } finally {
    adminReminderService
      .getAttendanceReminderSummary =
        originalGetSummary;
  }
});

test("bulk controller queues as the authenticated administrator", async () => {
  const originalQueue =
    adminReminderService
      .queueAttendanceReminders;
  const calls = [];

  adminReminderService
    .queueAttendanceReminders = async (
      requestedByUserId
    ) => {
      calls.push(requestedByUserId);

      return {
        matched: 3,
        eligible: 2,
        queued: 2,
        alreadyQueued: 0,
        cooldown: 0,
        withoutDevice: 1,
        concurrentSkipped: 0,
        remainingEligible: 0,
      };
    };

  try {
    const response = createResponse();

    await queueAttendanceReminders(
      {
        user: {
          userId: 9,
          role: "ADMIN",
        },
      },
      response
    );

    assert.deepEqual(calls, [9]);
    assert.equal(response.statusCode, 202);
    assert.equal(response.body.success, true);
    assert.match(
      response.body.message,
      /2 recordatorios/
    );
    assert.equal(
      response.body.summary.queued,
      2
    );
  } finally {
    adminReminderService
      .queueAttendanceReminders =
        originalQueue;
  }
});

test("bulk controller keeps an empty result friendly", async () => {
  const originalQueue =
    adminReminderService
      .queueAttendanceReminders;

  adminReminderService
    .queueAttendanceReminders = async () => ({
      matched: 0,
      eligible: 0,
      queued: 0,
      alreadyQueued: 0,
      cooldown: 0,
      withoutDevice: 0,
      concurrentSkipped: 0,
      remainingEligible: 0,
    });

  try {
    const response = createResponse();

    await queueAttendanceReminders(
      {
        user: {
          userId: 9,
          role: "ADMIN",
        },
      },
      response
    );

    assert.equal(response.statusCode, 202);
    assert.equal(response.body.success, true);
    assert.match(
      response.body.message,
      /No hay citas/
    );
  } finally {
    adminReminderService
      .queueAttendanceReminders =
        originalQueue;
  }
});

test("individual controller rejects unsafe appointment identifiers", async () => {
  const originalQueue =
    adminReminderService
      .queueAppointmentAttendanceReminder;
  let callCount = 0;

  adminReminderService
    .queueAppointmentAttendanceReminder = async () => {
      callCount += 1;
    };

  try {
    for (const id of [
      "0",
      "not-a-number",
      "9007199254740992",
    ]) {
      const response = createResponse();

      await queueAppointmentAttendanceReminder(
        {
          params: { id },
          user: { userId: 9 },
        },
        response
      );

      assert.equal(
        response.statusCode,
        400
      );
      assert.equal(
        response.body.success,
        false
      );
    }

    assert.equal(callCount, 0);
  } finally {
    adminReminderService
      .queueAppointmentAttendanceReminder =
        originalQueue;
  }
});

test("individual controller records appointment and administrator", async () => {
  const originalQueue =
    adminReminderService
      .queueAppointmentAttendanceReminder;
  const calls = [];

  adminReminderService
    .queueAppointmentAttendanceReminder = async (
      appointmentId,
      requestedByUserId
    ) => {
      calls.push({
        appointmentId,
        requestedByUserId,
      });

      return {
        id: 44,
        appointmentId,
        status: "QUEUED",
      };
    };

  try {
    const response = createResponse();

    await queueAppointmentAttendanceReminder(
      {
        params: { id: "17" },
        user: {
          userId: 9,
          role: "ADMIN",
        },
      },
      response
    );

    assert.deepEqual(calls, [
      {
        appointmentId: 17,
        requestedByUserId: 9,
      },
    ]);
    assert.equal(response.statusCode, 202);
    assert.equal(response.body.success, true);
    assert.equal(
      response.body.reminder.status,
      "QUEUED"
    );
  } finally {
    adminReminderService
      .queueAppointmentAttendanceReminder =
        originalQueue;
  }
});

test("individual controller preserves public service errors", async () => {
  const originalQueue =
    adminReminderService
      .queueAppointmentAttendanceReminder;
  const originalConsoleError = console.error;

  adminReminderService
    .queueAppointmentAttendanceReminder = async () => {
      const error = new Error(
        "El cliente no tiene un dispositivo habilitado para recibir notificaciones."
      );
      error.statusCode = 422;
      throw error;
    };
  console.error = () => {};

  try {
    const response = createResponse();

    await queueAppointmentAttendanceReminder(
      {
        params: { id: "17" },
        user: { userId: 9 },
      },
      response
    );

    assert.equal(response.statusCode, 422);
    assert.equal(response.body.success, false);
    assert.match(
      response.body.message,
      /no tiene un dispositivo/
    );
  } finally {
    console.error = originalConsoleError;
    adminReminderService
      .queueAppointmentAttendanceReminder =
        originalQueue;
  }
});
