const test = require("node:test");
const assert = require("node:assert/strict");

const {
  NotificationOperationTimeoutError,
  createExpoPushTokenOptions,
  getDevicePushTokenKey,
  withNotificationTimeout,
} = require("../src/utils/notification-registration.ts");

test("the Expo request reuses the native token received by the listener", () => {
  const devicePushToken = {
    type: "android",
    data: "native-fcm-token",
  };

  const options = createExpoPushTokenOptions(
    "eas-project-id",
    devicePushToken
  );

  assert.equal(options.projectId, "eas-project-id");
  assert.equal(options.devicePushToken, devicePushToken);
});

test("native token keys are stable without exposing the token to logs", () => {
  assert.equal(
    getDevicePushTokenKey({
      type: "android",
      data: "native-fcm-token",
    }),
    "android:native-fcm-token"
  );
});

test("token acquisition has a bounded wait", async () => {
  const neverSettles = new Promise(() => {});

  await assert.rejects(
    withNotificationTimeout(neverSettles, 5, "expo"),
    (error) =>
      error instanceof NotificationOperationTimeoutError &&
      error.stage === "expo"
  );
});

test("successful token acquisition clears the watchdog", async () => {
  const value = await withNotificationTimeout(
    Promise.resolve("ExpoPushToken[test]"),
    100,
    "expo"
  );

  assert.equal(value, "ExpoPushToken[test]");
});
