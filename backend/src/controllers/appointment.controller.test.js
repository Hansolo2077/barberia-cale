const test = require("node:test");
const assert = require("node:assert/strict");

const appointmentService =
  require("../services/appointment.service");
const {
  confirmAttendance,
} = require("./appointment.controller");

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

test("confirmAttendance rejects identifiers outside the safe integer range", async () => {
  for (const id of ["0", "not-a-number", "9007199254740992"]) {
    const response = createResponse();

    await confirmAttendance(
      {
        params: { id },
        user: { userId: 7 },
      },
      response
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.success, false);
  }
});

test("confirmAttendance uses the authenticated client as owner", async () => {
  const originalConfirm =
    appointmentService.confirmAppointmentAttendance;
  const calls = [];

  appointmentService.confirmAppointmentAttendance = async (
    userId,
    appointmentId
  ) => {
    calls.push({ userId, appointmentId });
    return {
      id: appointmentId,
      status: "ACCEPTED",
      attendanceStatus: "CONFIRMED",
      canConfirmAttendance: false,
    };
  };

  try {
    const response = createResponse();

    await confirmAttendance(
      {
        params: { id: "17" },
        user: { userId: 7 },
      },
      response
    );

    assert.deepEqual(calls, [
      { userId: 7, appointmentId: 17 },
    ]);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.equal(
      response.body.appointment.attendanceStatus,
      "CONFIRMED"
    );
  } finally {
    appointmentService.confirmAppointmentAttendance =
      originalConfirm;
  }
});
