const test = require("node:test");
const assert = require("node:assert/strict");
const { readBuildIdentity } = require("./build-identity");
test("deployment identity reports the provider supplied full SHA only", () => {
  const sha = "ABCDEF0123456789ABCDEF0123456789ABCDEF01";
  assert.deepEqual(readBuildIdentity({ RENDER: "true", RENDER_GIT_COMMIT: sha, DATABASE_URL: "private" }), {
    revision: sha.toLowerCase(), provider: "render",
  });
});
test("missing or malformed deployment revision stays unknown", () => {
  for (const revision of [undefined, "main", "shortsha", "private-value", "a".repeat(41)]) {
    assert.equal(readBuildIdentity({ RENDER_GIT_COMMIT: revision }).revision, null);
  }
  assert.equal(readBuildIdentity({}).provider, "local");
});
