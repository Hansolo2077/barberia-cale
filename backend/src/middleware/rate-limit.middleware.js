function createRateLimiter({
  windowMs,
  maxRequests,
  message,
}) {
  const attempts = new Map();
  let lastSweep = Date.now();

  return function rateLimit(req, res, next) {
    const now = Date.now();

    if (now - lastSweep >= windowMs) {
      attempts.forEach((entry, key) => {
        if (entry.resetAt <= now) {
          attempts.delete(key);
        }
      });
      lastSweep = now;
    }

    const key =
      req.ip ||
      req.socket?.remoteAddress ||
      "unknown";
    const current = attempts.get(key);
    const entry =
      !current || current.resetAt <= now
        ? {
            count: 0,
            resetAt: now + windowMs,
          }
        : current;

    entry.count += 1;
    attempts.set(key, entry);

    if (entry.count > maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((entry.resetAt - now) / 1000)
      );

      res.set("Retry-After", String(retryAfterSeconds));

      return res.status(429).json({
        success: false,
        message,
      });
    }

    return next();
  };
}

module.exports = {
  createRateLimiter,
};
