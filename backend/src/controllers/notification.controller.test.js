const test = require("node:test");
const assert = require("node:assert/strict");

const notificationService =
  require("../services/notification.service");
const {
  registerDevice,
  deactivateDevice,
} = require("./notification.controller");

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

test("registerDevice validates token and platform", async () => {
  for (const body of [
    {
      expoPushToken: "invalid",
      platform: "android",
    },
    {
      expoPushToken: "ExpoPushToken[token123]",
      platform: "web",
    },
  ]) {
    const response = createResponse();

    await registerDevice(
      {
        body,
        user: { userId: 7 },
      },
      response
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.success, false);
  }
});

test("registerDevice binds a valid token to the authenticated client", async () => {
  const originalRegister = notificationService.registerDevice;
  const calls = [];

  notificationService.registerDevice = async (data) => {
    calls.push(data);
    return { id: 4, ...data, active: true };
  };

  try {
    const response = createResponse();

    await registerDevice(
      {
        body: {
          expoPushToken: " ExpoPushToken[token123] ",
          platform: "android",
        },
        user: { userId: 7 },
      },
      response
    );

    assert.deepEqual(calls, [
      {
        userId: 7,
        expoPushToken: "ExpoPushToken[token123]",
        platform: "android",
      },
    ]);
    assert.equal(response.body.device.active, true);
  } finally {
    notificationService.registerDevice = originalRegister;
  }
});

test("deactivateDevice is idempotent and scoped by user", async () => {
  const originalDeactivate = notificationService.deactivateDevice;
  const calls = [];

  notificationService.deactivateDevice = async (
    userId,
    token
  ) => {
    calls.push({ userId, token });
    return null;
  };

  try {
    const response = createResponse();

    await deactivateDevice(
      {
        body: {
          expoPushToken: "ExpoPushToken[token123]",
        },
        user: { userId: 7 },
      },
      response
    );

    assert.deepEqual(calls, [
      {
        userId: 7,
        token: "ExpoPushToken[token123]",
      },
    ]);
    assert.equal(response.body.success, true);
    assert.equal(response.body.deactivated, false);
  } finally {
    notificationService.deactivateDevice = originalDeactivate;
  }
});
