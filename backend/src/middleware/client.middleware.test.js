const test = require("node:test");
const assert = require("node:assert/strict");

const {
  requireClient,
} = require("./client.middleware");

function createResponse() {
  return {
    statusCode: null,
    payload: null,
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

test("requireClient accepts CLIENT and rejects ADMIN", () => {
  let continued = false;

  requireClient(
    { user: { role: "CLIENT" } },
    createResponse(),
    () => {
      continued = true;
    }
  );

  assert.equal(continued, true);

  const response = createResponse();
  requireClient(
    { user: { role: "ADMIN" } },
    response,
    () => assert.fail("ADMIN should not reach CLIENT routes")
  );

  assert.equal(response.statusCode, 403);
});
