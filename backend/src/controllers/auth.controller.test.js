const test = require("node:test");
const assert = require("node:assert/strict");

const {
  login,
  register,
} = require("./auth.controller");
const {
  PHONE_VALIDATION_MESSAGE,
} = require("../utils/phone");

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

test("register rejects a phone that does not satisfy the complete rule", async () => {
  const response = createResponse();

  await register(
    {
      body: {
        firstName: "Ana",
        lastName: "López",
        phone: "61234567",
        password: "secret1",
      },
    },
    response
  );

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    success: false,
    message: PHONE_VALIDATION_MESSAGE,
  });
});

test("login rejects spaces even when eight digits are present", async () => {
  const response = createResponse();

  await login(
    {
      body: {
        phone: "8123 4567",
        password: "secret1",
      },
    },
    response
  );

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    success: false,
    message: PHONE_VALIDATION_MESSAGE,
  });
});
