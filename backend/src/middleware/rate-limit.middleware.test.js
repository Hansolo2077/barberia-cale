const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createRateLimiter,
} = require("./rate-limit.middleware");

function createResponse() {
  return {
    headers: {},
    statusCode: null,
    payload: null,
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("rate limiter rejects requests over the per-IP limit", () => {
  const limiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 2,
    message: "Espera antes de reintentar.",
  });
  const request = {
    ip: "203.0.113.10",
    socket: {},
  };

  let accepted = 0;
  limiter(request, createResponse(), () => {
    accepted += 1;
  });
  limiter(request, createResponse(), () => {
    accepted += 1;
  });

  const blockedResponse = createResponse();
  limiter(request, blockedResponse, () => {
    accepted += 1;
  });

  assert.equal(accepted, 2);
  assert.equal(blockedResponse.statusCode, 429);
  assert.equal(
    blockedResponse.payload.message,
    "Espera antes de reintentar."
  );
  assert.ok(Number(blockedResponse.headers["Retry-After"]) >= 1);
});
