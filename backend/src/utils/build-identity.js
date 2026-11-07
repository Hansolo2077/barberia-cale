// Public deployment metadata only. Never fall back to an unrelated local SHA.
function readBuildIdentity(env = process.env) {
  const revision = /^[a-f0-9]{40}$/i.test(env.RENDER_GIT_COMMIT || "")
    ? env.RENDER_GIT_COMMIT.toLowerCase()
    : null;
  return { revision, provider: env.RENDER === "true" ? "render" : "local" };
}
module.exports = { readBuildIdentity };
