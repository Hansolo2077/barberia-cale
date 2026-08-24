const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const authService = require("../services/auth.service");
const {
  authenticateToken,
} = require("./auth.middleware");

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

test("authenticateToken uses the current database role", async () => {
  const previousSecret = process.env.JWT_SECRET;
  const originalFindUser = authService.findPublicUserById;
  process.env.JWT_SECRET = "test-secret-with-enough-entropy";

  authService.findPublicUserById = async () => ({
    id: 7,
    firstName: "Ana",
    lastName: "López",
    phone: "88888888",
    role: "CLIENT",
  });

  try {
    const token = jwt.sign(
      { userId: 7, role: "ADMIN" },
      process.env.JWT_SECRET
    );
    const request = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    const response = createResponse();
    let continued = false;

    await authenticateToken(request, response, () => {
      continued = true;
    });

    assert.equal(continued, true);
    assert.equal(request.user.role, "CLIENT");
    assert.equal(request.currentUser.role, "CLIENT");
  } finally {
    authService.findPublicUserById = originalFindUser;

    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
  }
});
