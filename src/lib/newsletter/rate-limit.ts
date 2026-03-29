/**
 * Per-IP sliding-window style counter in Redis (INCR + EXPIRE). Used by public newsletter POST routes.
 */
import { Redis } from "@upstash/redis";

function getRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Upstash Redis is not configured");
  }
  return new Redis({ url, token });
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function applyRateLimit(input: {
  request: Request;
  scope: string;
  maxRequests: number;
  windowSeconds: number;
}): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const redis = getRedisClient();
  const ip = getClientIp(input.request);
  const key = `newsletter:ratelimit:${input.scope}:${ip}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, input.windowSeconds);
  }

  if (current > input.maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: input.windowSeconds,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}
