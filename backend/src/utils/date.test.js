const test = require("node:test");
const assert = require("node:assert/strict");

const {
  daysBetween,
  isValidIsoDate,
} = require("./date");

test("isValidIsoDate rejects impossible calendar dates", () => {
  assert.equal(isValidIsoDate("2026-02-29"), false);
  assert.equal(isValidIsoDate("2026-99-10"), false);
  assert.equal(isValidIsoDate("22-08-2026"), false);
});

test("isValidIsoDate accepts leap days and valid ISO dates", () => {
  assert.equal(isValidIsoDate("2028-02-29"), true);
  assert.equal(isValidIsoDate("2026-08-22"), true);
});

test("daysBetween uses calendar days without local timezone drift", () => {
  assert.equal(daysBetween("2026-08-22", "2026-08-22"), 0);
  assert.equal(daysBetween("2026-08-22", "2026-11-22"), 92);
});
