import rateLimit from "express-rate-limit";

export function createRateLimiter({windowMs, limit, message}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: {ok: false, message},
  });
}
