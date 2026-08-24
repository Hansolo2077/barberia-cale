const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeExpoPushToken,
} = require("./expo-push-token");

test("normalizes current and legacy Expo push tokens", () => {
  assert.equal(
    normalizeExpoPushToken(" ExpoPushToken[abc_123-XYZ] "),
    "ExpoPushToken[abc_123-XYZ]"
  );
  assert.equal(
    normalizeExpoPushToken("ExponentPushToken[legacy123]"),
    "ExponentPushToken[legacy123]"
  );
});

test("rejects malformed Expo push tokens", () => {
  for (const token of [
    null,
    "",
    "plain-token",
    "ExpoPushToken[]",
    "ExpoPushToken[has space]",
    "ExpoPushToken[unterminated",
  ]) {
    assert.equal(normalizeExpoPushToken(token), null);
  }
});
