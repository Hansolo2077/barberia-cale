const test = require("node:test");
const assert = require("node:assert/strict");

const {
  sendControllerError,
} = require("./http-error");

function createResponse() {
  const response = {
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

  return response;
}

test("sendControllerError preserves classified 4xx messages", () => {
  const response = createResponse();
  const error = new Error("Conflicto conocido.");
  error.statusCode = 409;

  sendControllerError(response, error, "Fallo interno.");

  assert.equal(response.statusCode, 409);
  assert.equal(response.payload.message, "Conflicto conocido.");
});

test("sendControllerError hides unclassified internal messages", () => {
  const response = createResponse();

  sendControllerError(
    response,
    new Error("value too long for type character varying(100)"),
    "Fallo interno."
  );

  assert.equal(response.statusCode, 500);
  assert.equal(response.payload.message, "Fallo interno.");
});
